import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyStateCard } from '../components/EmptyStateCard';
import { deleteFood, listFoods, saveFood, saveUserFoodEdit } from '../db/foodsRepo';
import { useTheme } from '../theme/ThemeProvider';
import type { FoodItem } from '../types/models';

type FoodsScreenProps = {
  onFoodsChanged: () => void;
};

type FoodDraft = {
  id?: string;
  name: string;
  brand: string;
  barcode: string;
  servingSize: string;
  servingUnit: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
};

const emptyDraft: FoodDraft = {
  name: '',
  brand: '',
  barcode: '',
  servingSize: '1',
  servingUnit: 'serving',
  calories: '0',
  carbs: '0',
  protein: '0',
  fat: '0',
};

export function FoodsScreen({ onFoodsChanged }: FoodsScreenProps) {
  const { colors } = useTheme();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<FoodDraft>(emptyDraft);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    listFoods(query).then((rows) => {
      if (active) {
        setFoods(rows);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);

  async function refresh() {
    setFoods(await listFoods(query));
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      return;
    }

    if (editingFood?.scope === 'shared') {
      await saveUserFoodEdit({
        ...editingFood,
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        barcode: draft.barcode.trim() || null,
        servingSize: Number(draft.servingSize) || 1,
        servingUnit: draft.servingUnit.trim() || 'serving',
        calories: Number(draft.calories) || 0,
        carbs: Number(draft.carbs) || 0,
        protein: Number(draft.protein) || 0,
        fat: Number(draft.fat) || 0,
      });
      setStatus('Saved as your local override and queued as a backend review request.');
    } else {
      await saveFood({
        id: draft.id,
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        barcode: draft.barcode.trim() || null,
        servingSize: Number(draft.servingSize) || 1,
        servingUnit: draft.servingUnit.trim() || 'serving',
        calories: Number(draft.calories) || 0,
        carbs: Number(draft.carbs) || 0,
        protein: Number(draft.protein) || 0,
        fat: Number(draft.fat) || 0,
        scope: editingFood?.scope ?? 'user',
        status: editingFood?.status ?? 'canonical',
        baseFoodId: editingFood?.baseFoodId ?? null,
      });
      setStatus(editingFood ? 'Food updated.' : 'Food saved to your local catalog.');
    }

    setDraft(emptyDraft);
    setEditingFood(null);
    await refresh();
    onFoodsChanged();
  }

  const userFoods = useMemo(() => foods.filter((food) => food.scope === 'user').length, [foods]);

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.accentSecondary }]}>FUEL DATABASE SEARCH</Text>
        <Text style={[styles.title, { color: colors.text }]}>Search, compare, and tune your food library in the same view.</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, brand, or barcode"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
        />

        <View style={styles.statRow}>
          <StatChip label="Results" value={`${foods.length}`} tone={colors.accent} />
          <StatChip label="Your foods" value={`${userFoods}`} tone={colors.accentSecondary} />
          <StatChip label="Shared" value={`${Math.max(0, foods.length - userFoods)}`} tone={colors.premium} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.catalogPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>DATABASE RESULTS</Text>
          <View style={styles.resultsList}>
            {foods.length > 0 ? (
              foods.map((food) => (
                <View key={food.id} style={[styles.foodCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <View style={styles.foodHeader}>
                    <View style={styles.foodCopy}>
                      <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                      <Text style={[styles.foodMeta, { color: colors.muted }]}>
                        {food.brand ? `${food.brand} • ` : ''}
                        {food.servingSize} {food.servingUnit}
                        {food.barcode ? ` • ${food.barcode}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.scopeBadge, { borderColor: food.scope === 'user' ? colors.accent : colors.border }]}>
                      <Text style={[styles.scopeLabel, { color: food.scope === 'user' ? colors.accent : colors.muted }]}>{food.scope}</Text>
                    </View>
                  </View>

                  <View style={styles.macroRow}>
                    <MacroPill label="Cal" value={String(food.calories)} />
                    <MacroPill label="Carbs" value={String(food.carbs)} />
                    <MacroPill label="Protein" value={String(food.protein)} />
                    <MacroPill label="Fat" value={String(food.fat)} />
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={() => {
                        setEditingFood(food);
                        setDraft({
                          id: food.id,
                          name: food.name,
                          brand: food.brand ?? '',
                          barcode: food.barcode ?? '',
                          servingSize: String(food.servingSize),
                          servingUnit: food.servingUnit,
                          calories: String(food.calories),
                          carbs: String(food.carbs),
                          protein: String(food.protein),
                          fat: String(food.fat),
                        });
                        setStatus('');
                      }}
                    >
                      <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={async () => {
                        await deleteFood(food.id);
                        await refresh();
                        onFoodsChanged();
                      }}
                    >
                      <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <EmptyStateCard title="No foods found" body="Try a broader search or create the food in the editor panel." />
            )}
          </View>
        </View>

        <View style={[styles.editorPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.accentSecondary }]}>
            {editingFood ? 'ADD FOOD / EDIT FOOD' : 'ADD FOOD / SEARCH FOOD'}
          </Text>

          <View style={styles.formGrid}>
            <FoodField label="Name" value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
            <FoodField label="Brand" value={draft.brand} onChangeText={(value) => setDraft((current) => ({ ...current, brand: value }))} />
            <FoodField label="Barcode" value={draft.barcode} onChangeText={(value) => setDraft((current) => ({ ...current, barcode: value }))} />
            <FoodField label="Serving size" value={draft.servingSize} onChangeText={(value) => setDraft((current) => ({ ...current, servingSize: value }))} />
            <FoodField label="Serving unit" value={draft.servingUnit} onChangeText={(value) => setDraft((current) => ({ ...current, servingUnit: value }))} />
            <FoodField label="Calories" value={draft.calories} onChangeText={(value) => setDraft((current) => ({ ...current, calories: value }))} />
            <FoodField label="Carbs" value={draft.carbs} onChangeText={(value) => setDraft((current) => ({ ...current, carbs: value }))} />
            <FoodField label="Protein" value={draft.protein} onChangeText={(value) => setDraft((current) => ({ ...current, protein: value }))} />
            <FoodField label="Fat" value={draft.fat} onChangeText={(value) => setDraft((current) => ({ ...current, fat: value }))} />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={() => void handleSave()}>
              <Text style={styles.primaryButtonLabel}>{draft.id ? 'Update food' : 'Save food'}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => {
                setDraft(emptyDraft);
                setEditingFood(null);
                setStatus('');
              }}
            >
              <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>Reset</Text>
            </Pressable>
          </View>

          {status ? <Text style={[styles.statusText, { color: colors.muted }]}>{status}</Text> : null}
        </View>
      </View>
    </View>
  );

  function StatChip({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
      <View style={[styles.statChip, { borderColor: tone }]}>
        <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  function MacroPill({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.macroPill}>
        <Text style={styles.macroPillLabel}>{label}</Text>
        <Text style={styles.macroPillValue}>{value}</Text>
      </View>
    );
  }

  function FoodField({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
  }) {
    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor={colors.muted}
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
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
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
  searchInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statChip: {
    minWidth: 100,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#ADAAAA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  catalogPanel: {
    flex: 1.1,
    minWidth: 300,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  editorPanel: {
    flex: 0.9,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultsList: {
    gap: 10,
  },
  foodCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  foodHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  foodCopy: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '800',
  },
  foodMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scopeLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroPill: {
    borderRadius: 999,
    backgroundColor: '#111111',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  macroPillLabel: {
    color: '#ADAAAA',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroPillValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    minWidth: 120,
    flexGrow: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  statusText: {
    fontSize: 12,
  },
});
