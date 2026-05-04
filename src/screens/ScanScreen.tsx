import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, Search, FileDown, Trash2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Reset scanned state when returning to this screen
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
        // Try searching by barcode if SKU not found
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
      const { data, error } = await supabase
        .from('items')
        .select('sku, label_no, name, weight_with_tag')
        .eq('is_remarked', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert("No Data", "No items have been remarked yet.");
        return;
      }

      // Generate CSV content
      const header = "SKU,Label No,Name,Weight With Tag\n";
      const rows = data.map(item => 
        `"${item.sku || ''}","${item.label_no || ''}","${item.name || ''}","${item.weight_with_tag || 0}"`
      ).join("\n");
      const csvContent = header + rows;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remarked_skus_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const filename = `${FileSystem.documentDirectory}remarked_skus_${new Date().getTime()}.csv`;
        await FileSystem.writeAsStringAsync(filename, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
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
                .update({ is_remarked: false })
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

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter SKU Manually"
            placeholderTextColor={Theme.colors.text.muted}
            value={manualSku}
            onChangeText={setManualSku}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            <Search size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10b981' }]} 
            onPress={handleExportRemarked}
            disabled={isExporting}
          >
            {isExporting ? <ActivityIndicator size="small" color="#fff" /> : <FileDown size={18} color="#fff" />}
            <Text style={styles.actionButtonText}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]} 
            onPress={handleClearRemarks}
          >
            <Trash2 size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedRow}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}>
            <Text style={styles.instruction}>Scan or Enter SKU above</Text>
            {loading && <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topActions: {
    backgroundColor: Theme.colors.background,
    padding: 15,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: Theme.colors.text.primary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  message: {
    textAlign: 'center',
    color: Theme.colors.text.primary,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  unfocusedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedRow: {
    flexDirection: 'row',
    height: 200,
  },
  focusedContainer: {
    width: 250,
    position: 'relative',
  },
  instruction: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Theme.colors.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
