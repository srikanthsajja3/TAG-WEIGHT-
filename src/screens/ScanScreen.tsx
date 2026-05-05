import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, ScrollView } from 'react-native';
import { Text, Button, Card, Searchbar, useTheme, Portal, Dialog, TextInput } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../supabase';

const ScanScreen = ({ navigation }: any) => {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const theme = useTheme();

  // Use local date parts to avoid UTC shifting
  const dateStr = exportDate.toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setLoading(false);
    });
    return unsubscribe;
  }, [navigation]);

  const searchItem = async (data: string) => {
    setLoading(true);
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('sku', data)
        .maybeSingle();

      if (error) throw error;

      if (item) {
        navigation.navigate('Detail', { item });
      } else {
        const { data: itemByBarcode, error: barcodeError } = await supabase
          .from('items')
          .select('*')
          .eq('barcode', data)
          .maybeSingle();
        
        if (barcodeError) throw barcodeError;
        
        if (itemByBarcode) {
          navigation.navigate('Detail', { item: itemByBarcode });
        } else {
          Alert.alert("Not Found", `No item found with SKU or Barcode: ${data}`, [
            { text: "OK", onPress: () => setScanned(false) }
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: any) => {
    if (scanned || loading) return;
    setScanned(true);
    searchItem(data);
  };

  const handleManualSearch = () => {
    if (!manualSku.trim()) return;
    searchItem(manualSku.trim());
  };

  const handleExportRemarked = async () => {
    setIsExporting(true);
    try {
      const startOfDay = new Date(exportDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(exportDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('items')
        .select('sku, net_wt, gross_wt, weight_with_tag, location, remarked_weight, remarked_at')
        .eq('is_remarked', true)
        .gte('remarked_at', startOfDay.toISOString())
        .lte('remarked_at', endOfDay.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert("No Data", `No remarked items found for ${exportDate.toLocaleDateString()}`);
        return;
      }

      const header = "SKU,Net Wt,Gross Wt,Tag Wt,Location,Remark Date Time,Remarked Weight\n";
      const rows = data.map(item => {
        const dateTime = item.remarked_at ? new Date(item.remarked_at).toLocaleString() : 'N/A';
        return `"${item.sku || ''}","${item.net_wt || 0}","${item.gross_wt || 0}","${item.weight_with_tag || 0}","${item.location || ''}","${dateTime}","${item.remarked_weight || 0}"`;
      }).join("\n");
      const csvContent = header + rows;

      const dateFilename = startOfDay.toISOString().split('T')[0];
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remarked_items_${dateFilename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const fs = FileSystem as any;
        const filename = `${fs.documentDirectory}remarked_items_${dateFilename}.csv`;
        await fs.writeAsStringAsync(filename, csvContent, { encoding: fs.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
      setShowExportModal(false);
    } catch (error: any) {
      Alert.alert("Export Error", error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearRemarks = () => {
    Alert.alert(
      "Clear All Remarks",
      "Are you sure you want to clear all remarked items?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('items')
                .update({ is_remarked: false, remarked_weight: null, remarked_at: null })
                .eq('is_remarked', true);
              if (error) throw error;
              Alert.alert("Success", "All remarks cleared.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.message}>We need your permission to show the camera</Text>
        <Button mode="contained" onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              <Searchbar
                placeholder="Enter SKU Manually"
                onChangeText={setManualSku}
                value={manualSku}
                onSubmitEditing={handleManualSearch}
                onIconPress={handleManualSearch}
                style={[styles.search, { flex: 1, marginBottom: 0 }]}
              />
              <Button 
                mode="contained" 
                onPress={handleManualSearch}
                style={{ justifyContent: 'center' }}
              >
                Search
              </Button>
            </View>
            <View style={styles.buttonRow}>
              <Button 
                mode="contained" 
                icon="file-download" 
                onPress={() => setShowExportModal(true)}
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              >
                Export CSV
              </Button>
              <Button 
                mode="contained" 
                icon="trash-can" 
                onPress={handleClearRemarks}
                style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              >
                Clear
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.cameraContainer}>
          {isFocused && (
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
              }}
            />
          )}
          <View style={[styles.overlay, StyleSheet.absoluteFill]}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedRow}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}>
                  <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
              </View>
              <View style={styles.unfocusedContainer}></View>
            </View>
            <View style={styles.unfocusedContainer}>
              <Text variant="labelLarge" style={styles.instruction}>Scan or Enter SKU above</Text>
              {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />}
            </View>
          </View>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showExportModal} onDismiss={() => setShowExportModal(false)}>
          <Dialog.Title style={{ fontWeight: 'bold' }}>Export Remarked Items</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 15, color: theme.colors.onSurfaceVariant }}>Select Review Date</Text>
            {Platform.OS === 'web' ? (
              <input 
                type="date" 
                value={dateStr} 
                onChange={(e) => setExportDate(new Date(e.target.value))}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.colors.outline}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.onSurface,
                  marginBottom: '24px',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            ) : (
              <Button mode="outlined" icon="calendar" onPress={() => setShowDatePicker(true)} style={{ marginBottom: 20 }}>
                {exportDate.toLocaleDateString()}
              </Button>
            )}
            {showDatePicker && (
              <DateTimePicker 
                value={exportDate} 
                mode="date" 
                onChange={(e, d) => { setShowDatePicker(false); if(d) setExportDate(d); }} 
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleExportRemarked} loading={isExporting} disabled={isExporting}>Download</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', flexGrow: 1 },
  card: { marginBottom: 20, elevation: 2 },
  search: { marginBottom: 15 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
  cameraContainer: {
    height: 400,
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  message: { textAlign: 'center', marginBottom: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  unfocusedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusedRow: { flexDirection: 'row', height: 220 },
  focusedContainer: { width: 250, position: 'relative' },
  instruction: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
});

export default ScanScreen;
