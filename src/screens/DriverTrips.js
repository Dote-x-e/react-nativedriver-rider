import React, { useEffect, useState, useContext } from 'react';
import { Text, View, StyleSheet, Dimensions, FlatList, Modal, TouchableHighlight, TouchableWithoutFeedback, Switch, Image, Platform } from 'react-native';
import { Button, Header } from 'react-native-elements';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useDispatch, useSelector } from 'react-redux';
import { FirebaseContext } from 'common/src';
import { Alert } from 'react-native';
import moment from 'moment/min/moment-with-locales';
import carImageIcon from '../../assets/images/track_Car.png';

var { width, height } = Dimensions.get('window');

export default function DriverTrips(props) {
    const { api, appcat } = useContext(FirebaseContext);
    const {
        acceptTask,
        cancelTask,
        updateProfile
    } = api;
    const dispatch = useDispatch();
    const tasks = useSelector(state => state.taskdata.tasks);
    const settings = useSelector(state => state.settingsdata.settings);
    const auth = useSelector(state => state.auth);
    const bookinglistdata = useSelector(state => state.bookinglistdata);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeBookings, setActiveBookings] = useState([]);
    const [region,setRegion] = useState(null);
    const gps = useSelector(state => state.gpsdata);
    const latitudeDelta = 0.0922;
    const longitudeDelta = 0.0421;
    const { t } = i18n;
    
    useEffect(() => {
        if (bookinglistdata.bookings) {
            setActiveBookings(
                bookinglistdata.bookings.filter(booking =>
                    booking.status == 'ACCEPTED' ||
                    booking.status == 'ARRIVED' ||
                    booking.status == 'STARTED' ||
                    booking.status == 'REACHED'
                )
            )
        }
    }, [bookinglistdata.bookings])

    const onPressAccept = (item) => {
        let wallet_balance = parseFloat(auth.info.profile.walletBalance);
        if (wallet_balance >= 0) {
            if (wallet_balance == 0){
                Alert.alert(
                    t('alert'),
                    t('wallet_balance_zero')
                );
            }
            dispatch(acceptTask(auth.info, item));
            setSelectedItem(null);
            setModalVisible(null);
            setTimeout(() => {
                props.navigation.navigate('BookedCab', { bookingId: item.id });
            }, 3000)
        } else {
            Alert.alert(
                t('alert'),
                t('wallet_balance_negative')
            );
        }
    };

    const onPressIgnore = (id) => {
        dispatch(cancelTask(id));
        setSelectedItem(null);
        setModalVisible(null)
    };

    const goToBooking = (id) => {
        props.navigation.navigate('BookedCab', { bookingId: id });
    };

    const onChangeFunction = () => {
        let res = !auth.info.profile.driverActiveStatus;
        dispatch(updateProfile(auth.info, { driverActiveStatus: res }));
    }

    useEffect(() => {  
        if(gps.location){  
            if(gps.location.lat && gps.location.lng){
                setRegion({
                    latitude: gps.location.lat,
                    longitude: gps.location.lng,
                    latitudeDelta: latitudeDelta,
                    longitudeDelta: longitudeDelta
                });  
            } 
        }
    }, [gps.location]);

    return (
        <View style={styles.mainViewStyle}>
            <Header
                backgroundColor={colors.GREY.default}
                leftComponent={{ icon: 'md-menu', type: 'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback, onPress: () => { props.navigation.toggleDrawer(); } }}
                centerComponent={<Text style={styles.headerTitleStyle}>{t('task_list')}</Text>}
                containerStyle={styles.headerStyle}
                rightComponent={() => {
                    return (
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Text style={{color:colors.WHITE, fontWeight:'bold', marginRight:3}}>{t('on_duty')}</Text>
                            <Switch
                                value={auth.info && auth.info.profile ? auth.info.profile.driverActiveStatus : false}
                                onValueChange={onChangeFunction}
                            />
                        </View>
                    );
                }}
                innerContainerStyles={styles.headerInnerStyle}
            />
            <FlatList
                data={auth.info && auth.info.profile && auth.info.profile.driverActiveStatus ?
                    (auth.info.profile.queue ? activeBookings : tasks) : []}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={
                    auth.info && auth.info.profile && auth.info.profile.driverActiveStatus ?
                    <View style={{height: height, width:width}}>
                        {region?
                        <MapView
                            region={{ 
                                latitude : region.latitude , 
                                longitude : region.longitude,
                                latitudeDelta: latitudeDelta,
                                longitudeDelta: longitudeDelta
                            }}
                            provider={PROVIDER_GOOGLE}
                            style={{height:height - (Platform.OS == 'android'? 15 :60),width:width}}
                        >
                            <Marker 
                                coordinate={{ latitude : region.latitude , longitude : region.longitude }}
                                pinColor={colors.GREEN.default}
                            >
                                <View style={{alignItems:'center'}}>
                                    <View style={{alignItems:'center', backgroundColor:'#fff', opacity:0.8, borderColor: '#000', borderWidth:1, borderRadius:10, paddingVertical:10, paddingHorizontal:5,marginBottom:5}}>
                                        <Text style={{fontWeight:'bold'}}>{t('where_are_you')}</Text>
                                        <Text style={{fontWeight:'bold'}}>{t('rider_not_here')}</Text>
                                    </View>
                                    <Image
                                        source={carImageIcon}
                                        style={{ height: 40, width: 40 }}
                                    />
                                </View>
                            </Marker>
                        </MapView>
                        :
                        <View style={{ alignItems: 'center', justifyContent: 'center',height: height, width:width }}>
                            <Text>{t('location_permission_error')}</Text>
                        </View>
                        }
                    </View>
                    :
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", height: height }}>
                        <View>
                            <Image
                                source={appcat == 'taxi'? require("../../assets/images/no_riders.png"): require("../../assets/images/no_agents.png")}
                                resizeMode="contain"
                                style={{ height: 120, width: 200 }}
                            ></Image>
                        </View>
                        <View>
                            <Text style={styles.no_driver_style}>
                                {t('service_off')}
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => {
                    return (
                        <View style={styles.listItemView}>
                            <View style={[styles.mapcontainer, activeBookings && activeBookings.length >= 1 ? { height: height - 500 } : null]}>
                                <MapView style={styles.map}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={{
                                        latitude: item.pickup.lat,
                                        longitude: item.pickup.lng,
                                        latitudeDelta: activeBookings && activeBookings.length >= 1 ? 0.0922 : 0.0822,
                                        longitudeDelta: activeBookings && activeBookings.length >= 1 ? 0.0421 : 0.0321
                                    }}
                                >
                                    <Marker
                                        coordinate={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                        title={item.pickup.add}
                                        description={t('pickup_location')}
                                        pinColor={colors.GREEN.default}
                                    />

                                    <Marker
                                        coordinate={{ latitude: item.drop.lat, longitude: item.drop.lng }}
                                        title={item.drop.add}
                                        description={t('drop_location')}
                                    />
                                    {item.coords ?
                                        <MapView.Polyline
                                            coordinates={item.coords}
                                            strokeWidth={4}
                                            strokeColor={colors.BLUE.default}
                                            lineDashPattern={[1]}
                                        />
                                    : null }
                                </MapView>
                            </View>

                            <View style={styles.mapDetails}>
                                <View style={styles.dateView}>
                                    <Text style={styles.listDate}>{moment(item.tripdate).format('lll')}</Text>
                                </View>
                                <View style={styles.rateViewStyle}>
                                    <Text style={styles.rateViewTextStyle}>{settings.symbol}{item ? item.estimate > 0 ? parseFloat(item.estimate).toFixed(2) : 0 : null}</Text>
                                </View>
                                <View style={styles.estimateView}>
                                    <Text style={styles.listEstimate}>{item.estimateDistance? parseFloat(item.estimateDistance).toFixed(2): 0} {settings.convert_to_mile? t('mile') : t('km')}</Text>
                                    <Text style={styles.listEstimate}>{item.estimateTime? parseFloat(item.estimateTime/60).toFixed(0): 0} {t('mins')}</Text>
                                </View>
                                <View style={styles.addressViewStyle}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={styles.greenDot}></View>
                                        <Text style={styles.addressViewTextStyle}>{item.pickup.add}</Text>
                                    </View>
                                    <View style={styles.fixAdressStyle}>
                                        <View style={styles.redDot}></View>
                                        <Text style={styles.addressViewTextStyle}>{item.drop.add}</Text>
                                    </View>
                                </View>
                                {appcat == 'delivery'?
                                <View style={styles.textContainerStyle}>
                                    <Text style={styles.textHeading}>{t('parcel_type')} - </Text>
                                    <Text style={styles.textContent}>
                                        {item && item.parcelTypeSelected? item.parcelTypeSelected.description : ''}
                                    </Text>
                                </View>
                                :null}
                                {appcat == 'delivery'?
                                <View style={styles.textContainerStyle}>
                                    <Text style={styles.textHeading}>{t('options')} - </Text>
                                    <Text style={styles.textContent}>
                                        {item && item.optionSelected? item.optionSelected.description : ''}
                                    </Text>
                                </View>
                                :null}
                                {appcat == 'delivery'?
                                <View style={styles.textContainerStyle2}>
                                    <Text style={styles.textHeading}>{t('pickUpInstructions')}</Text>
                                    <Text style={styles.textContent2}>
                                        {item? item.pickUpInstructions : ''}
                                    </Text>
                                </View>
                                :null}
                                {appcat == 'delivery'?
                                <View style={styles.textContainerStyle2}>
                                    <Text style={styles.textHeading}>{t('deliveryInstructions')}</Text>
                                    <Text style={styles.textContent2}>
                                        {item? item.deliveryInstructions : ''}
                                    </Text>
                                </View>
                                :null}
                                {activeBookings && activeBookings.length >= 1 ?
                                    <View style={styles.detailsBtnView}>
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                onPress={() => {
                                                    goToBooking(item.id);
                                                }}
                                                title={t('go_to_booking')}
                                                titleStyle={styles.titleStyles}
                                                buttonStyle={{
                                                    backgroundColor: colors.GREEN.light,
                                                    width: 180,
                                                    height: 50,
                                                    padding: 2,
                                                    borderColor: colors.TRANSPARENT,
                                                    borderWidth: 0,
                                                    borderRadius: 5,
                                                }}
                                                containerStyle={{
                                                    flex: 1,
                                                    alignSelf: 'center',
                                                    paddingRight: 14
                                                }}
                                            />
                                        </View>
                                    </View>
                                    :
                                    <View style={styles.detailsBtnView}>
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                onPress={() => {
                                                    setModalVisible(true);
                                                    setSelectedItem(item);
                                                }}
                                                title={t('ignore_text')}
                                                titleStyle={styles.titleStyles}
                                                buttonStyle={styles.myButtonStyle}
                                                containerStyle={{
                                                    flex: 1,
                                                    alignSelf: 'flex-end',
                                                    paddingRight: 14
                                                }}
                                            />
                                        </View>
                                        <View style={styles.viewFlex1}>
                                            <Button
                                                title={t('accept')}
                                                titleStyle={styles.titleStyles}
                                                onPress={() => {
                                                    onPressAccept(item)
                                                }}
                                                buttonStyle={{
                                                    backgroundColor: colors.GREEN.light,
                                                    width: height / 6,
                                                    padding: 2,
                                                    borderColor: colors.TRANSPARENT,
                                                    borderWidth: 0,
                                                    borderRadius: 5,
                                                }}
                                                containerStyle={{
                                                    flex: 1,
                                                    alignSelf: 'flex-start',
                                                    paddingLeft: 14
                                                }}
                                            />
                                        </View>
                                    </View>
                                }
                            </View>
                        </View>
                    )
                }
                }
            />

            <View style={styles.modalPage}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        Alert.alert(t('modal_close'));
                    }}>
                    <View style={styles.modalMain}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeading}>
                                <Text style={styles.alertStyle}>{t('alert_text')}</Text>
                            </View>
                            <View style={styles.modalBody}>
                                <Text style={{ fontSize: 16 }}>{t('ignore_job_title')}</Text>
                            </View>
                            <View style={styles.modalFooter}>
                                <TouchableHighlight
                                    style={[styles.btnStyle, styles.clickText]}
                                    onPress={() => {
                                        setModalVisible(!modalVisible);
                                        setSelectedItem(null);
                                    }}>
                                    <Text style={styles.cancelTextStyle}>{t('cancel')}</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    style={styles.btnStyle}
                                    onPress={() => {
                                        onPressIgnore(selectedItem.id)
                                    }}>
                                    <Text style={styles.okStyle}>{t('ok')}</Text>
                                </TouchableHighlight>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>

    )




}

//Screen Styling
const styles = StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerInnerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    mapcontainer: {
        flex: 1.5,
        width: width,
        height: 200,
        borderWidth: 7,
        borderColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapDetails: {
        backgroundColor: colors.WHITE,
        flex: 1,
        flexDirection: 'column',
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden'
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: colors.TRANSPARENT,
        borderStyle: 'solid',
        borderLeftWidth: 9,
        borderRightWidth: 9,
        borderBottomWidth: 10,
        borderLeftColor: colors.TRANSPARENT,
        borderRightColor: colors.TRANSPARENT,
        borderBottomColor: colors.YELLOW.secondary,
        transform: [
            { rotate: '180deg' }
        ]
    },
    signInTextStyle: {
        fontFamily: 'Roboto-Bold',
        fontWeight: "700",
        color: colors.WHITE
    },
    listItemView: {
        flex: 1,
        width: '100%',
        // height: 350,
        marginBottom: 10,
        flexDirection: 'column',
    },
    dateView: {
        flex: 1.1
    },
    listDate: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingLeft: 10,
        color: colors.GREY.default,
        flex: 1,
        alignSelf:'center'
    },
    estimateView:{
        flex: 1.1,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-around',
        marginBottom:10
    },
    listEstimate:{
        fontSize: 20,
        color: colors.GREY.secondary,
    },
    addressViewStyle: {
        flex: 2,
        paddingLeft: 10
    },
    no_driver_style: {
        color: colors.GREY.secondary,
        fontSize: 18,
    },
    addressViewTextStyle: {
        color: colors.GREY.secondary,
        fontSize: 15,
        marginLeft: 15,
        lineHeight: 24,
        flexWrap: "wrap",
    },
    greenDot: {
        backgroundColor: colors.GREEN.default,
        width: 10,
        height: 10,
        borderRadius: 50
    },
    redDot: {
        backgroundColor: colors.RED,
        width: 10,
        height: 10,
        borderRadius: 50
    },
    detailsBtnView: {
        flex: 2,
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: width,
        marginTop: 20,
        marginBottom: 20
    },

    modalPage: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalMain: {
        flex: 1,
        backgroundColor: colors.GREY.background,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '80%',
        backgroundColor: colors.WHITE,
        borderRadius: 10,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 15,
        flex: 1,
        maxHeight: 180
    },
    modalHeading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalBody: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalFooter: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopColor: colors.GREY.iconPrimary,
        borderTopWidth: 1,
        width: '100%',
    },
    btnStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainViewStyle: {
        flex: 1,
        //marginTop: StatusBar.currentHeight
    },
    fixAdressStyle: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    myButtonStyle: {
        backgroundColor: colors.RED,
        width: height / 6,
        padding: 2,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 5,
    },
    alertStyle: {
        fontWeight: 'bold',
        fontSize: 18,
        width: '100%',
        textAlign: 'center'
    },
    cancelTextStyle: {
        color: colors.BLUE.secondary,
        fontSize: 18,
        fontWeight: 'bold',
        width: "100%",
        textAlign: 'center'
    },
    okStyle: {
        color: colors.BLUE.secondary,
        fontSize: 18,
        fontWeight: 'bold'
    },
    viewFlex1: {
        flex: 1
    },
    clickText: {
        borderRightColor: colors.GREY.iconPrimary,
        borderRightWidth: 1
    },
    titleStyles: {
        width: "100%",
        alignSelf: 'center'
    },
    rateViewStyle: {
        alignItems: 'center',
        flex: 2,
        marginTop:10,
        marginBottom:10
    },
    rateViewTextStyle: {
        fontSize: 50,
        color: colors.BLACK,
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
        textAlign: "center"
    },
    textContainerStyle: {
        flexDirection: 'row',
        alignItems: "flex-start",
        marginLeft: 35,
        marginRight: 35,
        marginTop: 10
    },
    textContainerStyle2: {
        flexDirection: 'column',
        alignItems: "flex-start",
        marginLeft: 35,
        marginRight: 35,
        marginTop: 10
    },
    textHeading: {
        fontWeight: 'bold',
        color: colors.GREY.secondary,
        fontSize: 15,
    },
    textContent: {
        color: colors.GREY.secondary,
        fontSize: 15,
        marginLeft: 3,
    },
    textContent2: {
        marginTop: 4,
        color: colors.GREY.secondary,
        fontSize: 15
    },
});