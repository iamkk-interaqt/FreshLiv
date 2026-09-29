import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { mapsApi, PlaceSuggestion } from "../src/services/googleMaps";

export default function LocationScreen() {
  const router = useRouter();
  const { vertical = "DAIRY" } = useLocalSearchParams<{ vertical?: string }>();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [selected, setSelected] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 3 || query === address) {
      setPlaces([]);
      return;
    }
    const timer = setTimeout(async () => {
      try { setPlaces(await mapsApi.searchPlaces(query.trim())); } catch { setPlaces([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, address]);

  const select = async (place: PlaceSuggestion) => {
    setSelected(place.location);
    setAddress(place.formattedAddress || place.name);
    setQuery(place.formattedAddress || place.name);
    setPlaces([]);
  };

  const useCurrentLocation = async () => {
    setBusy(true); setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission was not granted.");
        return;
      }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setSelected(coords);
      const result = await mapsApi.reverseGeocode(coords.latitude, coords.longitude);
      const label = result.formattedAddress || "Current location";
      setAddress(label); setQuery(label);
    } catch {
      setError("Could not read your location. Search for your address instead.");
    } finally { setBusy(false); }
  };

  const continueToMarketplace = () => {
    if (!selected) return;
    router.push({ pathname: "/customer-home", params: {
      locality: address, postalCode: "", latitude: String(selected.latitude),
      longitude: String(selected.longitude), vertical: String(vertical)
    }});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CUSTOMER LOCATION</Text>
      <Text style={styles.title}>Where should we deliver?</Text>
      <Text style={styles.body}>Choose your current location or search your delivery address.</Text>

      <TextInput value={query} onChangeText={setQuery} placeholder="Search area, society, street or PIN"
        placeholderTextColor="#999" style={styles.input} />

      {places.length > 0 && <View style={styles.results}>
        {places.map((p) => <Pressable key={p.id} style={styles.result} onPress={() => select(p)}>
          <Text style={styles.resultTitle}>{p.name}</Text>
          <Text style={styles.resultAddress}>{p.formattedAddress}</Text>
        </Pressable>)}
      </View>}

      <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={busy}>
        {busy ? <ActivityIndicator /> : <Text style={styles.pin}>⌖</Text>}
        <Text style={styles.locationText}>Use my current location</Text>
      </Pressable>

      {selected ? <MapView provider={PROVIDER_GOOGLE} style={styles.map}
        region={{ ...selected, latitudeDelta: 0.01, longitudeDelta: 0.01 }} showsUserLocation>
        <Marker coordinate={selected} title="Delivery location" description={address} />
      </MapView> :
      <View style={styles.placeholder}><Text style={styles.bigPin}>📍</Text>
        <Text style={styles.placeholderTitle}>Select your delivery location</Text>
        <Text style={styles.placeholderBody}>FreshLiv will use it to find nearby active sellers.</Text>
      </View>}

      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable disabled={!selected} onPress={continueToMarketplace}
        style={[styles.button, !selected && styles.disabled]}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
      <Text style={styles.note}>Location is used for seller serviceability and delivery.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,paddingTop:58,backgroundColor:"#fff"},
  eyebrow:{fontSize:12,fontWeight:"800",letterSpacing:1.5,color:"#777"},
  title:{marginTop:8,fontSize:29,lineHeight:36,fontWeight:"800"},
  body:{marginTop:8,fontSize:15,lineHeight:22,color:"#666"},
  input:{marginTop:18,height:52,borderWidth:1,borderColor:"#ddd",borderRadius:13,paddingHorizontal:15,fontSize:16},
  results:{marginTop:5,borderWidth:1,borderColor:"#e5e5e5",borderRadius:13,overflow:"hidden"},
  result:{padding:13,borderBottomWidth:1,borderBottomColor:"#eee"},
  resultTitle:{fontSize:15,fontWeight:"700"}, resultAddress:{marginTop:3,fontSize:12,color:"#777"},
  locationButton:{marginTop:12,height:48,borderRadius:13,borderWidth:1,borderColor:"#ddd",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
  pin:{fontSize:22},locationText:{fontSize:15,fontWeight:"700"},
  map:{flex:1,minHeight:220,marginTop:14,borderRadius:18,overflow:"hidden"},
  placeholder:{flex:1,minHeight:220,marginTop:14,borderRadius:18,borderWidth:1,borderColor:"#e5e5e5",alignItems:"center",justifyContent:"center",padding:28},
  bigPin:{fontSize:38},placeholderTitle:{marginTop:10,fontSize:17,fontWeight:"800"},placeholderBody:{marginTop:6,color:"#777",textAlign:"center"},
  error:{marginTop:8,color:"#b00020",fontSize:13},button:{marginTop:12,height:54,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"#111"},
  disabled:{opacity:0.35},buttonText:{color:"#fff",fontSize:16,fontWeight:"700"},note:{marginTop:8,textAlign:"center",color:"#888",fontSize:11}
});
