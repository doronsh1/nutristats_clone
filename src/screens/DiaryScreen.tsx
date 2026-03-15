import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { getClipboardMeal, getDiaryDay, saveDiaryDay, setClipboardMeal } from '../db/diaryRepo';
import { listFoods } from '../db/foodsRepo';
import { calculateDaySummary, calculateMealTotals } from '../domain/calculations';
import { formatDateLabel, formatFullDateLabel, getTodayKey, getWeekKeys, shiftDateKey } from '../domain/dates';
import {
  applyFoodToEntry,
  createEmptyEntry,
  normalizeMealEntries,
  syncEntryFromAmount,
  syncEntryServingFromMacros,
} from '../domain/diary';
import { useTheme } from '../theme/ThemeProvider';
import type { DiaryDay, DiaryMeal, FoodItem, MealEntry, UserSettings } from '../types/models';

type DiaryScreenProps = {
  settings: UserSettings;
  foodsVersion: number;
  onDiarySaved: () => void;
};

export function DiaryScreen({ settings, foodsVersion, onDiarySaved }: DiaryScreenProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [day, setDay] = useState<DiaryDay | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [clipboardReady, setClipboardReady] = useState(false);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const skipSaveRef = useRef(true);

  useEffect(() => {
    let active = true;
    skipSaveRef.current = true;

    async function load() {
      const [loadedDay, loadedFoods, clipboardMeal] = await Promise.all([
        getDiaryDay(selectedDate, settings),
        listFoods(),
        getClipboardMeal(),
      ]);

      if (!active) {
        return;
      }

      setDay(loadedDay);
      setFoods(loadedFoods);
      setClipboardReady(Boolean(clipboardMeal));
      setSaveState('idle');
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
        .catch(() => {
          setSaveState('error');
        });
    }, 180);

    return () => clearTimeout(timeout);
  }, [day, onDiarySaved]);

  const summary = useMemo(() => (day ? calculateDaySummary(day) : null), [day]);
  const weekKeys = getWeekKeys(selectedDate);

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
      <SectionCard title="Diary" subtitle="Loading day data...">
        <Text style={{ color: colors.muted }}>Preparing meals, targets, and food suggestions.</Text>
      </SectionCard>
    );
  }

  return (
    <View style={styles.screen}>
      <SectionCard title="Date Navigation" subtitle="Move day by day or jump inside the current week.">
        <View style={styles.dateRow}>
          <Pressable style={[styles.navButton, { borderColor: colors.border }]} onPress={() => setSelectedDate(shiftDateKey(selectedDate, -1))}>
            <Text style={[styles.navButtonLabel, { color: colors.text }]}>Previous</Text>
          </Pressable>
          <View style={styles.dateCenter}>
            <Text style={[styles.dateTitle, { color: colors.text }]}>{formatFullDateLabel(selectedDate)}</Text>
            <Text style={[styles.dateSubtle, { color: colors.muted }]}>
              {selectedDate === getTodayKey() ? 'Today' : 'Tracked day'}
            </Text>
          </View>
          <Pressable style={[styles.navButton, { borderColor: colors.border }]} onPress={() => setSelectedDate(shiftDateKey(selectedDate, 1))}>
            <Text style={[styles.navButtonLabel, { color: colors.text }]}>Next</Text>
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {weekKeys.map((key) => {
            const active = key === selectedDate;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedDate(key)}
                style={[
                  styles.weekButton,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceMuted,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.weekButtonLabel, { color: active ? colors.surface : colors.text }]}>
                  {formatDateLabel(key)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Macro Summary" subtitle="Targets are editable. Totals update as meal rows change.">
        <View style={styles.targetGrid}>
          <NumericField
            label="Calorie Goal"
            value={day.calorieGoal}
            onChangeValue={(value) => updateDay((current) => ({ ...current, calorieGoal: value }))}
          />
          <NumericField
            label="Protein Target"
            value={day.proteinTarget}
            onChangeValue={(value) => updateDay((current) => ({ ...current, proteinTarget: value }))}
          />
          <NumericField
            label="Carb Target"
            value={day.carbTarget}
            onChangeValue={(value) => updateDay((current) => ({ ...current, carbTarget: value }))}
          />
          <NumericField
            label="Fat Target"
            value={day.fatTarget}
            onChangeValue={(value) => updateDay((current) => ({ ...current, fatTarget: value }))}
          />
          <NumericField
            label="Manual Adj."
            value={day.manualCalorieAdjustment}
            onChangeValue={(value) => updateDay((current) => ({ ...current, manualCalorieAdjustment: value }))}
          />
        </View>

        <View style={styles.macroCards}>
          <MacroCard label="Protein" actual={summary.protein.grams} target={day.proteinTarget} calories={summary.protein.calories} percentage={summary.protein.percentage} />
          <MacroCard label="Carbs" actual={summary.carbs.grams} target={day.carbTarget} calories={summary.carbs.calories} percentage={summary.carbs.percentage} />
          <MacroCard label="Fat" actual={summary.fat.grams} target={day.fatTarget} calories={summary.fat.calories} percentage={summary.fat.percentage} />
          <MacroCard label="Calories" actual={summary.totals.calories} target={summary.goalCalories} calories={summary.totals.calories} percentage={0} />
        </View>

        <Text style={[styles.saveState, { color: saveState === 'error' ? colors.danger : colors.muted }]}>
          {saveState === 'saving' ? 'Saving changes...' : saveState === 'saved' ? 'All changes saved locally.' : saveState === 'error' ? 'Save failed. Check local storage permissions.' : 'Edits save automatically.'}
        </Text>
      </SectionCard>

      {day.meals.map((meal) => {
        const mealTotals = calculateMealTotals(meal.entries);
        return (
          <SectionCard
            key={meal.id}
            title={`Meal ${meal.mealIndex + 1}`}
            subtitle="Spreadsheet-style entry with inline suggestions and live meal totals."
          >
            <View style={styles.mealToolbar}>
              <TextInput
                value={meal.title}
                onChangeText={(value) => updateMeal(meal.id, (current) => ({ ...current, title: value }))}
                placeholder="Meal title"
                placeholderTextColor={colors.muted}
                style={[
                  styles.mealTitleInput,
                  { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                ]}
              />
              <View style={styles.mealActionGroup}>
                <ActionButton label="Copy" onPress={() => void handleCopyMeal(meal)} />
                <ActionButton label="Paste" onPress={() => void handlePasteMeal(meal.id)} disabled={!clipboardReady} />
                <ActionButton label="Clear" onPress={() => handleClearMeal(meal.id)} />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <TableHeader />
                {meal.entries.map((entry) => {
                  const suggestions = focusedEntryId === entry.id && entry.itemName.trim()
                    ? foods
                        .filter((food) => food.name.toLowerCase().includes(entry.itemName.trim().toLowerCase()))
                        .slice(0, 5)
                    : [];

                  return (
                    <View key={entry.id} style={styles.rowWrapper}>
                      <View style={[styles.tableRow, { borderColor: colors.border }]}>
                        <View style={[styles.itemCell, styles.cell]}>
                          <TextInput
                            value={entry.itemName}
                            onChangeText={(value) =>
                              updateEntry(meal.id, entry.id, (current) => ({
                                ...current,
                                itemName: value,
                                foodItemId: null,
                              }))
                            }
                            onFocus={() => setFocusedEntryId(entry.id)}
                            placeholder="Search or type a custom item"
                            placeholderTextColor={colors.muted}
                            style={[
                              styles.cellInput,
                              { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
                            ]}
                          />
                          {suggestions.length > 0 ? (
                            <View style={[styles.suggestionList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                              {suggestions.map((food) => (
                                <Pressable
                                  key={food.id}
                                  style={[styles.suggestionItem, { borderColor: colors.border }]}
                                  onPress={() => {
                                    updateEntry(meal.id, entry.id, (current) => applyFoodToEntry(current, food));
                                    setFocusedEntryId(null);
                                  }}
                                >
                                  <Text style={[styles.suggestionTitle, { color: colors.text }]}>{food.name}</Text>
                                  <Text style={[styles.suggestionMeta, { color: colors.muted }]}>
                                    {food.servingSize} {food.servingUnit} · {food.calories} kcal
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : null}
                        </View>

                        <CellNumberInput
                          value={entry.amount}
                          onChangeValue={(value) =>
                            updateEntry(meal.id, entry.id, (current) => syncEntryFromAmount(current, value))
                          }
                        />
                        <CellNumberInput
                          value={entry.calories}
                          onChangeValue={(value) =>
                            updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, calories: value }))
                          }
                        />
                        <CellNumberInput
                          value={entry.carbs}
                          onChangeValue={(value) =>
                            updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, carbs: value }))
                          }
                        />
                        <CellNumberInput
                          value={entry.protein}
                          onChangeValue={(value) =>
                            updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, protein: value }))
                          }
                        />
                        <CellNumberInput
                          value={entry.fat}
                          onChangeValue={(value) =>
                            updateEntry(meal.id, entry.id, (current) => syncEntryServingFromMacros({ ...current, fat: value }))
                          }
                        />
                        <View style={[styles.deleteCell, styles.cell]}>
                          <Pressable
                            style={[styles.deleteButton, { borderColor: colors.border }]}
                            onPress={() =>
                              updateMeal(meal.id, (current) =>
                                normalizeMealEntries({
                                  ...current,
                                  entries: current.entries.filter((row) => row.id !== entry.id),
                                })
                              )
                            }
                          >
                            <Text style={[styles.deleteLabel, { color: colors.text }]}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}

                <View style={[styles.totalRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Meal Total</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>{mealTotals.calories}</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>{mealTotals.carbs}</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>{mealTotals.protein}</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>{mealTotals.fat}</Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.addRowButton, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              onPress={() =>
                updateMeal(meal.id, (current) => ({
                  ...current,
                  entries: [...current.entries, createEmptyEntry(current.entries.length)],
                }))
              }
            >
              <Text style={[styles.addRowLabel, { color: colors.text }]}>Add Row</Text>
            </Pressable>
          </SectionCard>
        );
      })}
    </View>
  );

  function NumericField({
    label,
    value,
    onChangeValue,
  }: {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
  }) {
    return (
      <View style={styles.numericField}>
        <Text style={[styles.numericLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          value={String(value)}
          onChangeText={(text) => onChangeValue(Number(text) || 0)}
          keyboardType="numeric"
          style={[
            styles.numericInput,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
          ]}
        />
      </View>
    );
  }

  function MacroCard({
    label,
    actual,
    target,
    calories,
    percentage,
  }: {
    label: string;
    actual: number;
    target: number;
    calories: number;
    percentage: number;
  }) {
    const delta = Math.round((actual - target) * 10) / 10;
    const deltaColor = delta > 0 ? colors.warning : delta < 0 ? colors.success : colors.muted;

    return (
      <View style={[styles.macroCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.macroActual, { color: colors.text }]}>{actual}</Text>
        <Text style={[styles.macroMeta, { color: colors.muted }]}>
          Target {target} · {calories} kcal {percentage ? `· ${percentage}%` : ''}
        </Text>
        <Text style={[styles.macroDelta, { color: deltaColor }]}>
          {delta >= 0 ? '+' : ''}
          {delta}
        </Text>
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
          styles.actionButton,
          {
            borderColor: colors.border,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
    );
  }
}

function TableHeader() {
  const { colors } = useTheme();
  return (
    <View style={[styles.headerRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
      <Text style={[styles.headerCell, styles.itemHeader, { color: colors.muted }]}>Item</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Amount</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Calories</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Carbs</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Protein</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Fat</Text>
      <Text style={[styles.headerCell, { color: colors.muted }]}>Action</Text>
    </View>
  );
}

function CellNumberInput({
  value,
  onChangeValue,
}: {
  value: number;
  onChangeValue: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.numberCell, styles.cell]}>
      <TextInput
        value={String(value)}
        keyboardType="numeric"
        onChangeText={(text) => onChangeValue(Number(text) || 0)}
        style={[
          styles.cellInput,
          { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  navButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateCenter: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  dateSubtle: {
    fontSize: 13,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weekButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  macroCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  macroActual: {
    fontSize: 26,
    fontWeight: '800',
  },
  macroMeta: {
    fontSize: 12,
  },
  macroDelta: {
    fontSize: 13,
    fontWeight: '800',
  },
  saveState: {
    fontSize: 12,
  },
  mealToolbar: {
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
  mealActionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  table: {
    minWidth: 880,
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerCell: {
    width: 110,
    fontSize: 12,
    fontWeight: '700',
  },
  itemHeader: {
    width: 260,
  },
  rowWrapper: {
    zIndex: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cell: {
    width: 110,
    paddingRight: 8,
  },
  itemCell: {
    width: 260,
    zIndex: 3,
  },
  numberCell: {
    justifyContent: 'center',
  },
  deleteCell: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  cellInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
  },
  suggestionList: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    width: 276,
    fontSize: 13,
    fontWeight: '800',
  },
  totalValue: {
    width: 66,
    fontSize: 13,
    fontWeight: '800',
  },
  addRowButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addRowLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
