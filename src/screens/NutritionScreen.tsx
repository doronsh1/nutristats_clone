import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyStateCard } from '../components/EmptyStateCard';
import { getClipboardMeal, getDiaryDay, saveDiaryDay, setClipboardMeal } from '../db/diaryRepo';
import { ensureUserFood, findFoodByBarcode, searchFoodsCatalog } from '../db/foodsRepo';
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
    return (
      day?.meals
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
        .slice(0, 6) ?? []
    );
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
      <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>Loading fuel planner</Text>
        <Text style={[styles.loadingBody, { color: colors.muted }]}>Preparing diary day, foods, and saved templates.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>DAILY FUEL PLANNER</Text>
            <Text style={[styles.title, { color: colors.text }]}>Search, auto-fill, and saved meals are finally on the same surface.</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{formatFullDateLabel(selectedDate)}</Text>
          </View>
          <SaveBadge state={saveState} />
        </View>

        <View style={styles.dateNav}>
          <Pressable
            style={[styles.navButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            onPress={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
          >
            <Text style={[styles.navLabel, { color: colors.text }]}>Prev</Text>
          </Pressable>
          <View style={styles.dateDisplay}>
            <Text style={[styles.dateTitle, { color: colors.text }]}>{formatCompactDateLabel(selectedDate)}</Text>
            <Text style={[styles.dateBody, { color: colors.muted }]}>Active diary day</Text>
          </View>
          <Pressable
            style={[styles.navButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            onPress={() => setSelectedDate(shiftDateKey(selectedDate, 1))}
          >
            <Text style={[styles.navLabel, { color: colors.text }]}>Next</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.weekRow}>
            {weekKeys.map((dayKey) => {
              const active = dayKey === selectedDate;
              return (
                <Pressable
                  key={dayKey}
                  onPress={() => setSelectedDate(dayKey)}
                  style={[
                    styles.weekChip,
                    {
                      backgroundColor: active ? colors.accent : colors.surfaceMuted,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.weekChipLabel, { color: active ? '#000000' : colors.text }]}>{formatDateLabel(dayKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.metricRow}>
          <MetricCard label="Calories" value={`${Math.round(summary.totals.calories)}`} helper={`goal ${Math.round(summary.goalCalories)}`} tone={colors.accent} />
          <MetricCard label="Protein" value={`${summary.protein.grams}g`} helper={`${summary.protein.delta}g to target`} tone={colors.accentSecondary} />
          <MetricCard label="Carbs" value={`${summary.carbs.grams}g`} helper={`${summary.carbs.delta}g to target`} tone={colors.premium} />
          <MetricCard label="Fat" value={`${summary.fat.grams}g`} helper={`${summary.fat.delta}g to target`} tone={colors.muted} />
        </View>

        <View style={styles.heroActions}>
          <Pressable
            style={[styles.primaryAction, { backgroundColor: colors.accent }]}
            onPress={async () => {
              if (!permission?.granted) {
                await requestPermission();
              }
              setScannerOpen(true);
            }}
          >
            <Text style={styles.primaryActionLabel}>Scan barcode</Text>
          </Pressable>
          <Pressable style={[styles.secondaryAction, { borderColor: colors.border }]} onPress={onOpenFoods}>
            <Text style={[styles.secondaryActionLabel, { color: colors.text }]}>Open fuel database</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.quickAddCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>SAVED MEALS / TEMPLATES</Text>

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
                      backgroundColor: active ? colors.surfaceMuted : colors.background,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.mealSelectorTitle, { color: colors.text }]}>{meal.title || `Meal ${meal.mealIndex + 1}`}</Text>
                  <Text style={[styles.mealSelectorMeta, { color: active ? colors.accent : colors.muted }]}>
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
          placeholder={`Search food for ${selectedMeal?.title || 'selected meal'}`}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
        />

        {recentFoods.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={[styles.label, { color: colors.muted }]}>Recent foods</Text>
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
          </View>
        ) : null}

        <View style={styles.foodList}>
          {filteredFoods.length > 0 ? (
            filteredFoods.map((food) => (
              <View key={food.id} style={[styles.foodCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <View style={styles.foodCardCopy}>
                  <Text style={[styles.foodTitle, { color: colors.text }]}>{food.name}</Text>
                  <Text style={[styles.foodBody, { color: colors.muted }]}>
                    {food.servingSize} {food.servingUnit} • {food.calories} kcal
                    {food.brand ? ` • ${food.brand}` : ''}
                  </Text>
                </View>
                <Pressable style={[styles.smallButton, { backgroundColor: colors.accent }]} onPress={() => void addFoodToMeal(food)}>
                  <Text style={styles.smallButtonLabel}>Add</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <EmptyStateCard title="No foods match this search" body="Try a broader search or add the food from the database screen." />
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.barcodeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.accentSecondary }]}>ADD FOOD / SEARCH FOOD</Text>
          <TextInput
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Paste or scan a barcode"
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          />

          {barcodeMatch ? (
            <View style={[styles.barcodeResult, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <View style={styles.foodCardCopy}>
                <Text style={[styles.foodTitle, { color: colors.text }]}>{barcodeMatch.name}</Text>
                <Text style={[styles.foodBody, { color: colors.muted }]}>Matched from the {barcodeMatch.scope} catalog</Text>
              </View>
              <Pressable style={[styles.smallButton, { backgroundColor: colors.accent }]} onPress={() => void addFoodToMeal(barcodeMatch)}>
                <Text style={styles.smallButtonLabel}>Add to meal</Text>
              </Pressable>
            </View>
          ) : barcodeInput.trim() ? (
            <EmptyStateCard title="Barcode not recognized" body="Add the product to the fuel database once and reuse it after that." />
          ) : null}

          {CameraView ? (
            <View style={styles.scannerSection}>
              <Pressable
                style={[styles.secondaryAction, { borderColor: colors.border }]}
                onPress={async () => {
                  if (!permission?.granted) {
                    await requestPermission();
                  }
                  setScannerOpen((value) => !value);
                }}
              >
                <Text style={[styles.secondaryActionLabel, { color: colors.text }]}>
                  {scannerOpen ? 'Hide scanner' : 'Open scanner'}
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
            <Text style={[styles.helperText, { color: colors.muted }]}>Camera scanning requires expo-camera support in the current runtime.</Text>
          )}
        </View>

        <View style={[styles.targetsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.premium }]}>AUTO FILL RESULT PLAN</Text>
          <View style={styles.targetGrid}>
            <NumericField label="Calories" value={day.calorieGoal} onChangeValue={(value) => updateDay((current) => ({ ...current, calorieGoal: value }))} />
            <NumericField label="Protein" value={day.proteinTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, proteinTarget: value }))} />
            <NumericField label="Carbs" value={day.carbTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, carbTarget: value }))} />
            <NumericField label="Fat" value={day.fatTarget} onChangeValue={(value) => updateDay((current) => ({ ...current, fatTarget: value }))} />
            <NumericField label="Calorie adj." value={day.manualCalorieAdjustment} onChangeValue={(value) => updateDay((current) => ({ ...current, manualCalorieAdjustment: value }))} />
          </View>
        </View>
      </View>

      {day.meals.map((meal) => {
        const mealTotals = calculateMealTotals(meal.entries);
        const mealHasContent = meal.entries.some(
          (entry) =>
            entry.itemName.trim() ||
            entry.foodItemId ||
            entry.calories > 0 ||
            entry.carbs > 0 ||
            entry.protein > 0 ||
            entry.fat > 0
        );

        return (
          <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderCopy}>
                <Text style={[styles.sectionEyebrow, { color: selectedMeal?.id === meal.id ? colors.accent : colors.muted }]}>
                  {selectedMeal?.id === meal.id ? 'SELECTED MEAL' : `MEAL ${meal.mealIndex + 1}`}
                </Text>
                <TextInput
                  value={meal.title}
                  onChangeText={(value) => updateMeal(meal.id, (current) => ({ ...current, title: value }))}
                  placeholder={`Meal ${meal.mealIndex + 1}`}
                  placeholderTextColor={colors.muted}
                  style={[styles.mealTitleInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                />
                <Text style={[styles.mealSummary, { color: colors.muted }]}>
                  {Math.round(mealTotals.calories)} kcal • {Math.round(mealTotals.protein)}g protein
                </Text>
              </View>

              <View style={styles.inlineActions}>
                <MiniAction label="Copy" onPress={() => void handleCopyMeal(meal)} />
                <MiniAction label="Paste" onPress={() => void handlePasteMeal(meal.id)} disabled={!clipboardReady} />
                <MiniAction label="Clear" onPress={() => handleClearMeal(meal.id)} />
              </View>
            </View>

            {!mealHasContent ? (
              <EmptyStateCard title="Nothing logged yet" body="Use search, barcode add, or the manual rows below to build the meal." />
            ) : null}

            <View style={styles.entryList}>
              {meal.entries.map((entry, index) => (
                <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryIndex, { color: colors.muted }]}>Entry {index + 1}</Text>
                    <View style={styles.inlineActions}>
                      <MiniAction
                        label="Duplicate"
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
                      />
                      <MiniAction
                        label="Delete"
                        onPress={() =>
                          updateMeal(meal.id, (current) =>
                            normalizeMealEntries({
                              ...current,
                              entries: current.entries.filter((row) => row.id !== entry.id),
                            })
                          )
                        }
                      />
                    </View>
                  </View>

                  <TextInput
                    value={entry.itemName}
                    onChangeText={(value) =>
                      updateEntry(meal.id, entry.id, (current) => ({
                        ...current,
                        itemName: value,
                        foodItemId: null,
                      }))
                    }
                    placeholder="Food name or custom note"
                    placeholderTextColor={colors.muted}
                    style={[styles.entryNameInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                  />

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

            <Pressable
              style={[styles.secondaryAction, { borderColor: colors.border }]}
              onPress={() =>
                updateMeal(meal.id, (current) => ({
                  ...current,
                  entries: [...current.entries, createEmptyEntry(current.entries.length)],
                }))
              }
            >
              <Text style={[styles.secondaryActionLabel, { color: colors.text }]}>Add manual row</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );

  function MetricCard({
    label,
    value,
    helper,
    tone,
  }: {
    label: string;
    value: string;
    helper: string;
    tone: string;
  }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
        <Text style={[styles.metricHelper, { color: colors.muted }]}>{helper}</Text>
      </View>
    );
  }

  function SaveBadge({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
    const tone =
      state === 'saved' ? colors.premium : state === 'saving' ? colors.accentSecondary : state === 'error' ? colors.danger : colors.muted;

    return (
      <View style={[styles.saveBadge, { borderColor: tone }]}>
        <Text style={[styles.saveBadgeLabel, { color: tone }]}>
          {state === 'saving' ? 'Saving' : state === 'saved' ? 'Saved' : state === 'error' ? 'Error' : 'Ready'}
        </Text>
      </View>
    );
  }

  function MiniAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
      <Pressable
        style={[
          styles.miniAction,
          {
            borderColor: colors.border,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.miniActionLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
    );
  }

  function NumericField({
    label,
    value,
    onChangeValue,
    compact,
  }: {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
    compact?: boolean;
  }) {
    return (
      <View style={[styles.field, compact ? styles.compactField : null]}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChangeValue(Number(text) || 0)}
          keyboardType="numeric"
          style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  loadingBody: {
    fontSize: 14,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBadgeLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    minWidth: 70,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateDisplay: {
    flex: 1,
    gap: 2,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  dateBody: {
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  weekChipLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  metricHelper: {
    fontSize: 12,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryAction: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  primaryActionLabel: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryAction: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  secondaryActionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickAddCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealSelector: {
    minWidth: 130,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  mealSelectorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealSelectorMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  recentSection: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
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
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  foodCardCopy: {
    flex: 1,
    gap: 4,
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  foodBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  smallButton: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  smallButtonLabel: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  barcodeCard: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  targetsCard: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  barcodeResult: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  scannerSection: {
    gap: 10,
  },
  cameraShell: {
    height: 240,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
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
  mealCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  mealHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  mealHeaderCopy: {
    flex: 1,
    gap: 8,
  },
  mealTitleInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
  },
  mealSummary: {
    fontSize: 12,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  miniAction: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  miniActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryList: {
    gap: 10,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    gap: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryNameInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  entryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    minWidth: 130,
    flexGrow: 1,
    gap: 6,
  },
  compactField: {
    minWidth: 96,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
