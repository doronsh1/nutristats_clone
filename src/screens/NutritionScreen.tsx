import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { getClipboardMeal, getDiaryDay, saveDiaryDay, setClipboardMeal } from '../db/diaryRepo';
import { ensureUserFood, findFoodByBarcode, listFoods, searchFoodsCatalog } from '../db/foodsRepo';
import { calculateDaySummary, calculateMealTotals } from '../domain/calculations';
import { formatCompactDateLabel, formatDateLabel, formatFullDateLabel, getTodayKey, getWeekKeys, shiftDateKey } from '../domain/dates';
import { applyFoodToEntry, createEmptyEntry, normalizeMealEntries, syncEntryFromAmount, syncEntryServingFromMacros } from '../domain/diary';
import { useTheme } from '../theme/ThemeProvider';
import type { DiaryDay, DiaryMeal, FoodItem, MealEntry, UserSettings } from '../types/models';

const cameraModule = (() => {
  try {
    return require('expo-camera');
  } catch {
    return null;
  }
})();

const CameraView = cameraModule?.CameraView as React.ComponentType<any> | undefined;
const useCameraPermissions =
  (cameraModule?.useCameraPermissions as undefined | (() => [any, () => Promise<any>])) ??
  (() => [null, async () => ({ granted: false })]);

type NutritionScreenProps = {
  settings: UserSettings;
  foodsVersion: number;
  onDiarySaved: () => void;
  onOpenFoods: () => void;
};

export function NutritionScreen({ settings, foodsVersion, onDiarySaved, onOpenFoods }: NutritionScreenProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [day, setDay] = useState<DiaryDay | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [clipboardReady, setClipboardReady] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [foodQuery, setFoodQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMatch, setBarcodeMatch] = useState<FoodItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [permission, requestPermission] = useCameraPermissions();
  const skipSaveRef = useRef(true);
  const deferredFoodQuery = useDeferredValue(foodQuery);
  const deferredBarcodeInput = useDeferredValue(barcodeInput);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      searchFoodsCatalog(deferredFoodQuery).then((rows) => {
        if (active) {
          startTransition(() => {
            setFoods(rows);
          });
        }
      });
    }, deferredFoodQuery.trim() ? 220 : 0);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [deferredFoodQuery]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      findFoodByBarcode(deferredBarcodeInput).then((food) => {
        if (active) {
          startTransition(() => {
            setBarcodeMatch(food);
          });
        }
      });
    }, deferredBarcodeInput.trim() ? 180 : 0);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [deferredBarcodeInput]);

  useEffect(() => {
    let active = true;
    skipSaveRef.current = true;

    async function load() {
      const [loadedDay, loadedFoods, clipboardMeal] = await Promise.all([
        getDiaryDay(selectedDate, settings),
        searchFoodsCatalog(''),
        getClipboardMeal(),
      ]);

      if (active) {
        startTransition(() => {
          setDay(loadedDay);
          setFoods(loadedFoods);
          setClipboardReady(Boolean(clipboardMeal));
          setSelectedMealId((current) => current ?? loadedDay.meals[0]?.id ?? null);
          setSaveState('idle');
        });
      }
    }

    load().catch(() => {
      if (active) {
        setSaveState('error');
      }
    });

    return () => {
      active = false;
    };
  }, [selectedDate, settings, foodsVersion]);

  useEffect(() => {
    if (!day) {
      return;
    }

    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    setSaveState('saving');
    const timeout = setTimeout(() => {
      saveDiaryDay(day)
        .then(() => {
          setSaveState('saved');
          onDiarySaved();
        })
        .catch(() => setSaveState('error'));
    }, 650);

    return () => clearTimeout(timeout);
  }, [day, onDiarySaved]);

  const weekKeys = getWeekKeys(selectedDate);
  const summary = useMemo(() => (day ? calculateDaySummary(day) : null), [day]);
  const selectedMeal = day?.meals.find((meal) => meal.id === selectedMealId) ?? day?.meals[0] ?? null;
  const filteredFoods = foods.slice(0, 8);
  const recentFoods = useMemo(() => {
    const usedNames = new Set<string>();
    return day?.meals
      .flatMap((meal) => meal.entries)
      .filter((entry) => entry.itemName.trim())
      .map((entry) => foods.find((food) => food.id === entry.foodItemId) ?? null)
      .filter((food): food is FoodItem => {
        if (!food || usedNames.has(food.id)) {
          return false;
        }
        usedNames.add(food.id);
        return true;
      })
      .slice(0, 6) ?? [];
  }, [day, foods]);

  function updateDay(updater: (current: DiaryDay) => DiaryDay) {
    setDay((current) => (current ? updater(current) : current));
  }

  function updateMeal(mealId: string, updater: (meal: DiaryMeal) => DiaryMeal) {
    updateDay((current) => ({
      ...current,
      meals: current.meals.map((meal) => (meal.id === mealId ? updater(meal) : meal)),
    }));
  }

  function updateEntry(mealId: string, entryId: string, updater: (entry: MealEntry) => MealEntry) {
    updateMeal(mealId, (meal) =>
      normalizeMealEntries({
        ...meal,
        entries: meal.entries.map((entry) => (entry.id === entryId ? updater(entry) : entry)),
      })
    );
  }

  async function addFoodToMeal(food: FoodItem, mealId = selectedMeal?.id) {
    if (!mealId) {
      return;
    }

    const userFood = await ensureUserFood(food);
    updateMeal(mealId, (meal) => ({
      ...meal,
      entries: [...meal.entries, applyFoodToEntry(createEmptyEntry(meal.entries.length), userFood)],
    }));
    setFoodQuery('');
    setBarcodeInput('');
  }

  async function handleCopyMeal(meal: DiaryMeal) {
    await setClipboardMeal(meal);
    setClipboardReady(true);
  }

  async function handlePasteMeal(mealId: string) {
    const clipboardMeal = await getClipboardMeal();
    if (!clipboardMeal) {
      return;
    }

    updateMeal(mealId, (meal) => ({
      ...meal,
      title: clipboardMeal.title,
      entries: clipboardMeal.entries.map((entry, index) => ({
        ...entry,
        id: `${entry.id}_${Date.now()}_${index}`,
        rowOrder: index,
      })),
    }));
  }

  function handleClearMeal(mealId: string) {
    updateMeal(mealId, (meal) => ({
      ...meal,
      entries: [createEmptyEntry(0)],
    }));
  }

  if (!day || !summary) {
    return (
      <SectionCard title="Nutrition" subtitle="Loading planner...">
        <Text style={{ color: colors.muted }}>Preparing meals and food suggestions.</Text>
      </SectionCard>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.dateNav}>
          <Pressable
            style={[styles.navArrow, { borderColor: colors.border }]}
            onPress={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
          >
            <Text style={[styles.navArrowText, { color: colors.text }]}>‹</Text>
          </Pressable>
          <View style={styles.dateDisplay}>
            <Text style={[styles.dateLabel, { color: colors.text }]}>{formatCompactDateLabel(selectedDate)}</Text>
          </View>
          <Pressable
            style={[styles.navArrow, { borderColor: colors.border }]}
            onPress={() => setSelectedDate(shiftDateKey(selectedDate, 1))}
          >
            <Text style={[styles.navArrowText, { color: colors.text }]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.macroRow}>
          <MetricCard label="Calories" value={`${Math.round(summary.totals.calories)}`} helper={`Goal ${Math.round(summary.goalCalories)}`} />
          <MetricCard label="Protein" value={`${summary.protein.grams}g`} helper={`${summary.protein.percentage}% · target ${day.proteinTarget}`} />
          <MetricCard label="Carbs" value={`${summary.carbs.grams}g`} helper={`${summary.carbs.percentage}% · target ${day.carbTarget}`} />
          <MetricCard label="Fat" value={`${summary.fat.grams}g`} helper={`${summary.fat.percentage}% · target ${day.fatTarget}`} />
        </View>

        <View style={styles.primaryActions}>
          <Pressable style={[styles.heroAction, { backgroundColor: colors.accent }]} onPress={async () => {
            if (!permission?.granted) {
              await requestPermission();
            }
            setScannerOpen(true);
          }}>
            <Text style={styles.heroActionLabel}>Scan Barcode</Text>
          </Pressable>
          <Pressable style={[styles.heroAction, { backgroundColor: colors.accentSecondary }]} onPress={() => setFoodQuery('')}>
            <Text style={styles.heroActionLabel}>Search Food</Text>
          </Pressable>
          <Pressable style={[styles.heroActionGhost, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]} onPress={onOpenFoods}>
            <Text style={[styles.heroActionGhostLabel, { color: colors.text }]}>Food Library</Text>
          </Pressable>
        </View>
      </View>

      <SectionCard title="Quick Add" subtitle="Select a meal and search for foods to add">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mealSelectorRow}>
            {day.meals.map((meal) => {
              const active = selectedMeal?.id === meal.id;
              const totals = calculateMealTotals(meal.entries);
              return (
                <Pressable
                  key={meal.id}
                  onPress={() => setSelectedMealId(meal.id)}
                  style={[
                    styles.mealSelector,
                    {
                      backgroundColor: active ? colors.accent : colors.surfaceMuted,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.mealSelectorTitle, { color: active ? colors.surface : colors.text }]}>
                    {meal.title || `Meal ${meal.mealIndex + 1}`}
                  </Text>
                  <Text style={[styles.mealSelectorMeta, { color: active ? colors.surface : colors.muted }]}>
                    {Math.round(totals.calories)} kcal
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <TextInput
          value={foodQuery}
          onChangeText={setFoodQuery}
          placeholder="Search foods..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
        />

        {recentFoods.length > 0 ? (
          <View style={styles.recentRow}>
            {recentFoods.map((food) => (
              <Pressable
                key={food.id}
                style={[styles.recentChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                onPress={() => void addFoodToMeal(food)}
              >
                <Text style={[styles.recentLabel, { color: colors.text }]}>{food.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.foodList}>
          {filteredFoods.map((food) => (
            <View key={food.id} style={[styles.foodCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.foodCardMeta}>
                <Text style={[styles.foodCardTitle, { color: colors.text }]}>{food.name}</Text>
                <Text style={[styles.foodCardSubtitle, { color: colors.muted }]}>
                  {food.servingSize} {food.servingUnit} · {food.calories} kcal
                  {food.barcode ? ` · code ${food.barcode}` : ''}
                </Text>
                <View style={[styles.sourceBadge, { backgroundColor: food.scope === 'user' ? colors.accentSoft : colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sourceBadgeLabel, { color: food.scope === 'user' ? colors.accent : colors.muted }]}>
                    {food.scope}
                  </Text>
                </View>
              </View>
              <Pressable style={[styles.smallPrimaryButton, { backgroundColor: colors.accent }]} onPress={() => void addFoodToMeal(food)}>
                <Text style={styles.smallPrimaryLabel}>Add</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.barcodePanel}>
          <View style={styles.barcodeHeader}>
            <Text style={[styles.barcodeTitle, { color: colors.text }]}>Barcode add</Text>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={onOpenFoods}>
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Open Foods DB</Text>
            </Pressable>
          </View>
          <TextInput
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Scan or paste a barcode"
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          />
          {barcodeMatch ? (
            <View style={[styles.barcodeResult, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.foodCardMeta}>
                <Text style={[styles.foodCardTitle, { color: colors.text }]}>{barcodeMatch.name}</Text>
                <Text style={[styles.foodCardSubtitle, { color: colors.muted }]}>
                  Matched by barcode from {barcodeMatch.scope} catalog
                </Text>
              </View>
              <Pressable style={[styles.smallPrimaryButton, { backgroundColor: colors.accent }]} onPress={() => void addFoodToMeal(barcodeMatch)}>
                <Text style={styles.smallPrimaryLabel}>Add to Meal</Text>
              </Pressable>
            </View>
          ) : barcodeInput.trim() ? (
            <Text style={[styles.helperText, { color: colors.muted }]}>
              No match found. Add this item to your Foods DB to recognize it next time.
            </Text>
          ) : null}

          {CameraView ? (
            <View style={styles.scannerArea}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={async () => {
                  if (!permission?.granted) {
                    await requestPermission();
                  }
                  setScannerOpen((value) => !value);
                }}
              >
                <Text style={[styles.secondaryLabel, { color: colors.text }]}>
                  {scannerOpen ? 'Hide Scanner' : 'Open Scanner'}
                </Text>
              </Pressable>
              {scannerOpen ? (
                <View style={[styles.cameraShell, { borderColor: colors.border }]}>
                  <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{
                      barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
                    }}
                    onBarcodeScanned={({ data }: { data: string }) => {
                      setBarcodeInput(data);
                      setScannerOpen(false);
                    }}
                  />
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.helperText, { color: colors.muted }]}>
              Camera scanning requires additional setup. Install expo-camera to enable live scanning.
            </Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Daily Targets" subtitle="Customize your goals for today">
        <View style={styles.targetGrid}>
          <NumericField label="Calorie Goal" value={day.calorieGoal} onChangeValue={(value) => updateDay((current) => ({ ...current, calorieGoal: value }))} />
          <NumericField label="Protein Target" value={day.proteinTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, proteinTarget: value }))} />
          <NumericField label="Carb Target" value={day.carbTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, carbTarget: value }))} />
          <NumericField label="Fat Target" value={day.fatTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, fatTarget: value }))} />
          <NumericField label="Manual Adj." value={day.manualCalorieAdjustment} onChangeValue={(value) => updateDay((current) => ({ ...current, manualCalorieAdjustment: value }))} />
        </View>
        <Text style={[styles.helperText, { color: saveState === 'error' ? colors.danger : colors.muted }]}>
          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save failed' : 'Auto-save enabled'}
        </Text>
      </SectionCard>

      {day.meals.map((meal) => {
        const mealTotals = calculateMealTotals(meal.entries);
        return (
          <SectionCard
            key={meal.id}
            title={meal.title || `Meal ${meal.mealIndex + 1}`}
            subtitle={`${Math.round(mealTotals.calories)} calories • ${Math.round(mealTotals.protein)}g protein`}
          >
            <View style={styles.mealHeaderRow}>
              <TextInput
                value={meal.title}
                onChangeText={(value) => updateMeal(meal.id, (current) => ({ ...current, title: value }))}
                placeholder={`Meal ${meal.mealIndex + 1}`}
                placeholderTextColor={colors.muted}
                style={[styles.mealTitleInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
              />
              <View style={styles.inlineActions}>
                <ActionButton label="Copy" onPress={() => void handleCopyMeal(meal)} />
                <ActionButton label="Paste" onPress={() => void handlePasteMeal(meal.id)} disabled={!clipboardReady} />
                <ActionButton label="Clear" onPress={() => handleClearMeal(meal.id)} />
              </View>
            </View>

            <View style={styles.entryList}>
              {meal.entries.map((entry) => (
                <View key={entry.id} style={[styles.entryCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                  <View style={styles.entryTopRow}>
                    <TextInput
                      value={entry.itemName}
                      onChangeText={(value) =>
                        updateEntry(meal.id, entry.id, (current) => ({
                          ...current,
                          itemName: value,
                          foodItemId: null,
                        }))
                      }
                      placeholder="Custom item or quick note"
                      placeholderTextColor={colors.muted}
                      style={[styles.entryNameInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    />
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={() =>
                        updateMeal(meal.id, (current) => ({
                          ...current,
                          entries: [
                            ...current.entries,
                            {
                              ...entry,
                              id: `${entry.id}_copy_${Date.now()}`,
                              rowOrder: current.entries.length,
                            },
                          ],
                        }))
                      }
                    >
                      <Text style={[styles.secondaryLabel, { color: colors.text }]}>Duplicate</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={() =>
                        updateMeal(meal.id, (current) =>
                          normalizeMealEntries({
                            ...current,
                            entries: current.entries.filter((row) => row.id !== entry.id),
                          })
                        )
                      }
                    >
                      <Text style={[styles.secondaryLabel, { color: colors.text }]}>Delete</Text>
                    </Pressable>
                  </View>

                  <View style={styles.entryGrid}>
                    <NumericField compact label="Amount" value={entry.amount} onChangeValue={(value) => updateEntry(meal.id, entry.id, (current) => syncEntryFromAmount(current, value))} />
                    <NumericField compact label="Calories" value={entry.calories} onChangeValue={(value) => updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, calories: value }))} />
                    <NumericField compact label="Carbs" value={entry.carbs} onChangeValue={(value) => updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, carbs: value }))} />
                    <NumericField compact label="Protein" value={entry.protein} onChangeValue={(value) => updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, protein: value }))} />
                    <NumericField compact label="Fat" value={entry.fat} onChangeValue={(value) => updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, fat: value }))} />
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.mealFooter, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.mealFooterTitle, { color: colors.text }]}>Meal Total</Text>
              <Text style={[styles.mealFooterMeta, { color: colors.muted }]}>
                {mealTotals.calories} kcal · {mealTotals.protein}p · {mealTotals.carbs}c · {mealTotals.fat}f
              </Text>
            </View>

            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() =>
                updateMeal(meal.id, (current) => ({
                  ...current,
                  entries: [...current.entries, createEmptyEntry(current.entries.length)],
                }))
              }
            >
              <Text style={[styles.secondaryLabel, { color: colors.text }]}>Add Custom Row</Text>
            </Pressable>
          </SectionCard>
        );
      })}

      <View style={[styles.fabDock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable style={[styles.fabButton, { backgroundColor: colors.accent }]} onPress={async () => {
          if (!permission?.granted) {
            await requestPermission();
          }
          setScannerOpen(true);
        }}>
          <Text style={styles.fabLabel}>Scan</Text>
        </Pressable>
        <Pressable style={[styles.fabButton, { backgroundColor: colors.accentSecondary }]} onPress={() => setSelectedMealId(day.meals[0]?.id ?? null)}>
          <Text style={styles.fabLabel}>Meals</Text>
        </Pressable>
        <Pressable style={[styles.fabButton, { backgroundColor: colors.surfaceMuted }]} onPress={() => setFoodQuery('')}>
          <Text style={[styles.fabGhostLabel, { color: colors.text }]}>Search</Text>
        </Pressable>
      </View>
    </View>
  );

  function NumericField({
    label,
    value,
    onChangeValue,
    compact = false,
  }: {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
    compact?: boolean;
  }) {
    return (
      <View style={[styles.numericField, compact ? styles.numericFieldCompact : null]}>
        <Text style={[styles.numericLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChangeValue(Number(text) || 0)}
          keyboardType="numeric"
          style={[
            styles.numericInput,
            compact ? styles.numericInputCompact : null,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
          ]}
        />
      </View>
    );
  }

  function MetricCard({
    label,
    value,
    helper,
  }: {
    label: string;
    value: string;
    helper: string;
  }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.metricHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }

  function ActionButton({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.secondaryButton,
          {
            borderColor: colors.border,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[styles.secondaryLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navArrow: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 24,
    fontWeight: '700',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryActions: {
    gap: 10,
  },
  heroAction: {
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  heroActionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  heroActionGhost: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  heroActionGhostLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricCard: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  metricHelper: {
    fontSize: 12,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealSelector: {
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  mealSelectorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealSelectorMeta: {
    fontSize: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recentLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  foodList: {
    gap: 10,
  },
  foodCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  foodCardMeta: {
    flex: 1,
    gap: 2,
  },
  foodCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  foodCardSubtitle: {
    fontSize: 12,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  smallPrimaryButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  smallPrimaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  barcodePanel: {
    gap: 10,
  },
  barcodeHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  barcodeTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  barcodeResult: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  scannerArea: {
    gap: 10,
  },
  cameraShell: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 20,
    height: 220,
  },
  camera: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  numericField: {
    minWidth: 150,
    flexGrow: 1,
    gap: 6,
  },
  numericFieldCompact: {
    minWidth: 110,
  },
  numericLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  numericInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  numericInputCompact: {
    paddingVertical: Platform.OS === 'web' ? 10 : 9,
    fontSize: 14,
  },
  mealHeaderRow: {
    gap: 10,
  },
  mealTitleInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '700',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryList: {
    gap: 10,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  entryTopRow: {
    gap: 8,
  },
  entryNameInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '600',
  },
  entryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealFooter: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  mealFooterTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealFooterMeta: {
    fontSize: 13,
  },
  fabDock: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 26,
    padding: 10,
    marginBottom: 4,
  },
  fabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 14,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  fabGhostLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
});
