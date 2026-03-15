import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
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

  return (
    <View style={styles.screen}>
      <SectionCard title="Foods Database" subtitle="Search foods, create your own entries, and keep diary lookup fast.">
        <View style={styles.formGrid}>
          <FoodField label="Name" value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
          <FoodField label="Brand" value={draft.brand} onChangeText={(value) => setDraft((current) => ({ ...current, brand: value }))} />
          <FoodField label="Barcode" value={draft.barcode} onChangeText={(value) => setDraft((current) => ({ ...current, barcode: value }))} />
          <FoodField label="Serving Size" value={draft.servingSize} onChangeText={(value) => setDraft((current) => ({ ...current, servingSize: value }))} />
          <FoodField label="Serving Unit" value={draft.servingUnit} onChangeText={(value) => setDraft((current) => ({ ...current, servingUnit: value }))} />
          <FoodField label="Calories" value={draft.calories} onChangeText={(value) => setDraft((current) => ({ ...current, calories: value }))} />
          <FoodField label="Carbs" value={draft.carbs} onChangeText={(value) => setDraft((current) => ({ ...current, carbs: value }))} />
          <FoodField label="Protein" value={draft.protein} onChangeText={(value) => setDraft((current) => ({ ...current, protein: value }))} />
          <FoodField label="Fat" value={draft.fat} onChangeText={(value) => setDraft((current) => ({ ...current, fat: value }))} />
        </View>
        <View style={styles.actionRow}>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={() => void handleSave()}>
            <Text style={styles.primaryButtonLabel}>{draft.id ? 'Update Food' : 'Save Food'}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => {
              setDraft(emptyDraft);
              setEditingFood(null);
              setStatus('');
            }}
          >
            <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>New Food</Text>
          </Pressable>
        </View>
        {status ? <Text style={[styles.statusText, { color: colors.muted }]}>{status}</Text> : null}
      </SectionCard>

      <SectionCard title="Browse Foods" subtitle="Layered catalog: your foods first, shared foods next.">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or brand"
          placeholderTextColor={colors.muted}
          style={[
            styles.searchInput,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.headerRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.nameCol, styles.headerText, { color: colors.muted }]}>Food</Text>
              <Text style={[styles.barcodeCol, styles.headerText, { color: colors.muted }]}>Barcode</Text>
              <Text style={[styles.metaCol, styles.headerText, { color: colors.muted }]}>Serving</Text>
              <Text style={[styles.macroCol, styles.headerText, { color: colors.muted }]}>Calories</Text>
              <Text style={[styles.macroCol, styles.headerText, { color: colors.muted }]}>Carbs</Text>
              <Text style={[styles.macroCol, styles.headerText, { color: colors.muted }]}>Protein</Text>
              <Text style={[styles.macroCol, styles.headerText, { color: colors.muted }]}>Fat</Text>
              <Text style={[styles.actionCol, styles.headerText, { color: colors.muted }]}>Actions</Text>
            </View>
            {foods.map((food, index) => (
              <View
                key={food.id}
                style={[
                  styles.foodRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: index % 2 === 0 ? colors.surface : colors.surfaceMuted,
                  },
                ]}
              >
                <View style={styles.nameCol}>
                  <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                  {food.brand ? <Text style={[styles.foodBrand, { color: colors.muted }]}>{food.brand}</Text> : null}
                  <View style={[styles.scopeBadge, { backgroundColor: food.scope === 'user' ? colors.accentSoft : colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.scopeLabel, { color: food.scope === 'user' ? colors.accent : colors.muted }]}>
                      {food.scope}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.barcodeCol, styles.bodyText, { color: colors.text }]}>{food.barcode || '—'}</Text>
                <Text style={[styles.metaCol, styles.bodyText, { color: colors.text }]}>
                  {food.servingSize} {food.servingUnit}
                </Text>
                <Text style={[styles.macroCol, styles.bodyText, { color: colors.text }]}>{food.calories}</Text>
                <Text style={[styles.macroCol, styles.bodyText, { color: colors.text }]}>{food.carbs}</Text>
                <Text style={[styles.macroCol, styles.bodyText, { color: colors.text }]}>{food.protein}</Text>
                <Text style={[styles.macroCol, styles.bodyText, { color: colors.text }]}>{food.fat}</Text>
                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={() =>
                      {
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
                      }
                    }
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
            ))}
          </View>
        </ScrollView>
      </SectionCard>
    </View>
  );

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
          style={[
            styles.fieldInput,
            { borderColor: colors.border, backgroundColor: colors.background, color: colors.text },
          ]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    minWidth: 160,
    flexGrow: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  table: {
    minWidth: 860,
  },
  headerRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  foodRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  nameCol: {
    width: 220,
    paddingRight: 12,
  },
  metaCol: {
    width: 120,
  },
  barcodeCol: {
    width: 140,
  },
  macroCol: {
    width: 90,
  },
  actionCol: {
    width: 180,
    flexDirection: 'row',
    gap: 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
  },
  foodBrand: {
    fontSize: 12,
    marginTop: 3,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scopeLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
  },
});
