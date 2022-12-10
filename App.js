import axios from 'axios';
import React, {useEffect, useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {Button, Modal, StyleSheet, View, Text} from 'react-native';
import * as Location from 'expo-location';
import {LocationAccuracy} from "expo-location";

export default function App() {
    const [markers, setMarkers] = useState();
    const [visited, setVisited] = useState([]);
    const [position, setPosition] = useState();
    const [isModalVisible, setModalVisible] = useState(false);
    const [task, setTask] = useState();

    useEffect(() => {
        axios({
            method: "GET",
            url: "http://10.0.2.2:5041/getwaypoints",
            headers: {
                Accept: "application/json"
            }
        }).then((res) => {
            setMarkers(res.data);
        }).catch((err) => {
            console.log(err);
        });
    }, []);

    useEffect(() => {
        watchPosition();
    }, []);

    useEffect(() => {
        markers?.forEach((marker) => {
            const waypoint = {latitude: marker.Latitude, longitude: marker.Longitude};
            if (calculateDistance(waypoint, position) <= 10) {
                if (!visited?.includes(marker.Name)) {
                    handleModal();
                    setVisited([...visited, marker.Name]);
                    setTask(marker.Task);
                }
            }
        });
    }, [position]);

    let watchPosition = async () => {
        await Location.requestForegroundPermissionsAsync();
        await Location.watchPositionAsync({
                accuracy: LocationAccuracy.BestForNavigation,
                distanceInterval: 10
            },
            (position) => {
                const {latitude, longitude} = position.coords;

                setPosition({latitude: latitude, longitude: longitude});
            });
    }
    let calculateDistance = (x, y) => {
        const R = 6371e3;
        const φ1 = x.latitude * Math.PI / 180;
        const φ2 = y.latitude * Math.PI / 180;
        const Δφ = (y.latitude - x.latitude) * Math.PI / 180;
        const Δλ = (y.longitude - x.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
    let handleModal = () => setModalVisible(() => !isModalVisible);

//
    return (
        <View style={styles.container}>
            <MapView style={styles.map}
                     initialRegion={{
                         latitude: 49.81738326941694,
                         longitude: 19.0133707,
                         latitudeDelta: 0.002,
                         longitudeDelta: 0.002
                     }}>
                {markers?.map((marker) => <Marker
                    key={markers?.indexOf(marker)}
                    coordinate={{
                        latitude: marker.Latitude,
                        longitude: marker.Longitude
                    }}
                    title={marker.Name}/>)
                }
            </MapView>
            <Modal visible={isModalVisible}>
                <View style={{flex: 1}}>
                    <Text>{task}</Text>
                    <Button title="OK" onPress={handleModal}/>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
});
