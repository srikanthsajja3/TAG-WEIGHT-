import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Scale, Tag, Hash, ChevronLeft, Save, Star } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const DetailItem = ({ label, value, icon: Icon, color = Theme.colors.primary, isEditing, onChangeText }: any) => {
  return (
    <View style={styles.detailCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={value.toString()}
            onChangeText={onChangeText}
            keyboardType="numeric"
            autoFocus
          />
        ) : (
          <Text style={styles.value}>{value || '0.000'}</Text>
        )}
      </View>
    </View>
  );
};

export default function DetailScreen({ route, navigation }: any) {
  const { item: initialItem } = route.params;
  const [item, setItem] = useState(initialItem);
  const [newWeight, setNewWeight] = useState(initialItem.weight_with_tag?.toString() || '0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemarking, setIsRemarking] = useState(false);

  const handleUpdateWeight = async () => {
    if (isNaN(parseFloat(newWeight))) {
      Alert.alert("Error", "Please enter a valid number for weight.");
      return;
    }

    setIsUpdating(true);
    try {
      const weightValue = parseFloat(newWeight);
      const { data, error } = await supabase
        .from('items')
        .update({ weight_with_tag: weightValue })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      setItem(data);
      Alert.alert("Success", "Weight updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRemark = async () => {
    setIsRemarking(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .update({ is_remarked: !item.is_remarked })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsRemarking(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.name || 'Product Details'}</Text>
          <Text style={styles.subtitle}>{item.description || 'No description available'}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.topRow}>
            <DetailItem 
              label="SKU / Label No" 
              value={item.sku || item.label_no} 
              icon={Hash} 
              color="#3b82f6" 
            />
            <TouchableOpacity 
              style={[styles.remarkButton, item.is_remarked && styles.remarkActive]} 
              onPress={toggleRemark}
              disabled={isRemarking}
            >
              {isRemarking ? (
                <ActivityIndicator size="small" color={item.is_remarked ? "#fff" : "#fbbf24"} />
              ) : (
                <Star size={24} color={item.is_remarked ? "#fff" : "#fbbf24"} fill={item.is_remarked ? "#fff" : "transparent"} />
              )}
              <Text style={[styles.remarkText, item.is_remarked && { color: '#fff' }]}>
                {item.is_remarked ? "Remarked" : "Remark"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <DetailItem 
            label="Gross Weight" 
            value={`${item.gross_wt || '0.000'} g`} 
            icon={Scale} 
            color="#8b5cf6" 
          />
          
          <DetailItem 
            label="Net Weight" 
            value={`${item.net_wt || '0.000'} g`} 
            icon={Scale} 
            color="#6366f1" 
          />
          
          <View style={styles.updateSection}>
            <View style={styles.detailCard}>
              <View style={[styles.iconContainer, { backgroundColor: `#ec489915` }]}>
                <Tag size={24} color="#ec4899" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Weight with Tag</Text>
                <TextInput
                  style={styles.input}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="numeric"
                  placeholder="Enter weight"
                  placeholderTextColor={Theme.colors.text.muted}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.updateButton, isUpdating && { opacity: 0.7 }]} 
              onPress={handleUpdateWeight}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.updateButtonText}>Update Weight</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backButtonText}>Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
  },
  detailsGrid: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  remarkButton: {
    width: 100,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  remarkActive: {
    backgroundColor: '#fbbf24',
  },
  remarkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text.primary,
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text.primary,
    padding: 0,
  },
  updateSection: {
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
