import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text, Card, Button, TextInput, List, useTheme, Avatar, IconButton } from 'react-native-paper';
import { supabase } from '../../supabase';

const DetailScreen = ({ route, navigation }: any) => {
  const { item: initialItem } = route.params;
  const [item, setItem] = useState(initialItem);
  const [newWeight, setNewWeight] = useState(initialItem.weight_with_tag?.toString() || '0');
  const [numberOfTags, setNumberOfTags] = useState(initialItem.number_of_tags?.toString() || '1');
  const [remarkedWeight, setRemarkedWeight] = useState(initialItem.remarked_weight?.toString() || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const theme = useTheme();

  const handleSaveAll = async () => {
    setIsUpdating(true);
    try {
      const tagsCount = parseInt(numberOfTags, 10);
      if (isNaN(tagsCount) || tagsCount < 0) {
        Alert.alert("Error", "Please enter a valid number of tags.");
        setIsUpdating(false);
        return;
      }

      const updates: any = {
        weight_with_tag: parseFloat(newWeight) || 0,
        number_of_tags: tagsCount,
        is_remarked: item.is_remarked,
      };

      if (item.is_remarked) {
        if (!remarkedWeight || isNaN(parseFloat(remarkedWeight))) {
          Alert.alert("Error", "Please enter a valid remarked weight.");
          setIsUpdating(false);
          return;
        }
        updates.remarked_weight = parseFloat(remarkedWeight);
        updates.remarked_at = new Date().toISOString();
      } else {
        updates.remarked_weight = null;
        updates.remarked_at = null;
      }

      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      setItem(data);
      Alert.alert("Success", "Product details updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRemarkStatus = () => {
    setItem({ ...item, is_remarked: !item.is_remarked });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.center}>
            <Avatar.Icon 
              size={64} 
              icon="tag-outline" 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
              color={theme.colors.onPrimaryContainer} 
            />
            <Text variant="headlineMedium" style={styles.title}>{item.name || 'Product Details'}</Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>{item.description || 'No description available'}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <List.Item
              title="SKU / Label No"
              description={item.sku || item.label_no}
              left={(props: any) => <List.Icon {...props} icon="identifier" />}
              right={() => (
                <IconButton
                  icon={item.is_remarked ? "star" : "star-outline"}
                  iconColor={item.is_remarked ? "#FBBF24" : theme.colors.outline}
                  onPress={toggleRemarkStatus}
                />
              )}
            />
            <List.Item
              title="Location"
              description={item.location || 'N/A'}
              left={(props: any) => <List.Icon {...props} icon="map-marker" />}
            />
            <List.Item
              title="Gross Weight"
              description={`${item.gross_wt || '0.000'} g`}
              left={(props: any) => <List.Icon {...props} icon="scale" />}
            />
            <List.Item
              title="Net Weight"
              description={`${item.net_wt || '0.000'} g`}
              left={(props: any) => <List.Icon {...props} icon="scale-balance" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.inputCard}>
          <Card.Content>
            <TextInput
              label="Weight with Tag"
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="weight-gram" />}
            />

            <TextInput
              label="Number of Tags"
              value={numberOfTags}
              onChangeText={setNumberOfTags}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="tag-outline" />}
            />

            {item.is_remarked && (
              <View style={styles.remarkSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Verification & Remarks</Text>
                <TextInput
                  label="Remarked Weight"
                  value={remarkedWeight}
                  onChangeText={setRemarkedWeight}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="alert-circle-outline" />}
                  placeholder="Enter mistake weight"
                />
              </View>
            )}

            <Button 
              mode="contained" 
              icon="content-save" 
              onPress={handleSaveAll}
              loading={isUpdating}
              disabled={isUpdating}
              style={styles.saveButton}
            >
              Save Changes
            </Button>

            <Button 
              mode="outlined" 
              icon="barcode-scan" 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Scan Another
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', flexGrow: 1 },
  headerCard: { marginBottom: 15, elevation: 1 },
  detailsCard: { marginBottom: 15, elevation: 1 },
  inputCard: { marginBottom: 25, elevation: 2 },
  center: { alignItems: 'center', paddingVertical: 10 },
  title: { fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  input: { marginBottom: 15 },
  remarkSection: { marginTop: 10, marginBottom: 15 },
  sectionTitle: { marginBottom: 10, fontWeight: 'bold' },
  saveButton: { marginTop: 10, paddingVertical: 4 },
  backButton: { marginTop: 15 },
});

export default DetailScreen;
