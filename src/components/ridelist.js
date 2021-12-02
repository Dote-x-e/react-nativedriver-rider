import React, {useState, useContext} from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useSelector } from 'react-redux';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import moment from 'moment/min/moment-with-locales';
import { FirebaseContext } from 'common/src';

export default function RideList(props) {
    const { t } = i18n;
    const { appcat } = useContext(FirebaseContext);

    const settings = useSelector(state => state.settingsdata.settings);
    const [tabIndex,setTabIndex] = useState(props.tabIndex);

    const onPressButton = (item, index) => {
        props.onPressButton(item, index)
    }
    

    const renderData = ({ item, index }) => {
        return (
            <TouchableOpacity style={styles.iconClickStyle} onPress={() => onPressButton(item, index)}>
                <View style={styles.iconViewStyle}>
                    {appcat=='delivery'?
                    <Icon
                        name='truck-fast'
                        type='material-community'
                        color={colors.DARK}
                        size={35}
                    />
                    :
                    <Icon
                        name='car-sports'
                        type='material-community'
                        color={colors.DARK}
                        size={35}
                    />
                    }
                </View>
                <View style={styles.flexViewStyle}>
                    <View style={styles.textView1}>

                        <Text style={[styles.textStyle, styles.dateStyle]}>{item.bookingDate ? moment(item.bookingDate).format('lll') : ''}</Text>
                        <Text style={[styles.textStyle, styles.carNoStyle]}>{item.carType ? item.carType : null} - {item.vehicle_number ? item.vehicle_number : t('no_car_assign_text')}</Text>
                        <View style={[styles.picupStyle, styles.position]}>

                            <View style={styles.greenDot} />
                            <Text style={[styles.picPlaceStyle, styles.placeStyle]}>{item.pickup ? item.pickup.add : t('not_found_text')}</Text>
                        </View>
                        <View style={[styles.dropStyle, styles.textViewStyle]}>
                            <View style={[styles.redDot, styles.textPosition]} />
                            <Text style={[styles.dropPlaceStyle, styles.placeStyle]}>{item.drop ? item.drop.add : t('not_found_text')}</Text>
                        </View>

                    </View>
                    <View style={styles.textView2}>
                        <Text style={[styles.fareStyle, styles.dateStyle]}>{item.status == 'NEW' || item.status == 'PAYMENT_PENDING'? t(item.status) : null}</Text>
                        <Text style={[styles.fareStyle, styles.dateStyle]}>{item.status == 'PAID' || item.status == 'COMPLETE'? item.customer_paid ? settings.symbol + parseFloat(item.customer_paid).toFixed(2) : settings.symbol + parseFloat(item.estimate).toFixed(2) : null}</Text>
                        {
                            item.status == 'CANCELLED' ?
                                <Image
                                    style={styles.cancelImageStyle}
                                    source={require('../../assets/images/cancel.png')}
                                />
                                :
                                null
                        }
                    </View>
                </View>
            </TouchableOpacity>
        )
    }


    return (
        <View style={styles.textView3}>
            <SegmentedControlTab
                values={[t('active_booking'), t('COMPLETE'), t('CANCELLED')]}
                selectedIndex={tabIndex}
                onTabPress={(index)=>setTabIndex(index)}
                borderRadius={0}
                tabsContainerStyle={styles.segmentcontrol}
                tabStyle={{
                    borderWidth:0,
                    backgroundColor: 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.GREY.primary,

                }}
                activeTabStyle={{ borderBottomColor: colors.GREY.background, backgroundColor: 'transparent', borderBottomWidth: 2 }}
                tabTextStyle={{ color: colors.GREY.secondary, fontWeight: 'bold', }}
                activeTabTextStyle={{ color: colors.GREY.background }}
            />
            <FlatList
                keyExtractor={(item, index) => index.toString()}
                data={tabIndex===0? props.data.filter(item=> !(item.status==='CANCELLED' || item.status==='COMPLETE')) : ( tabIndex === 1? props.data.filter(item=>item.status==='COMPLETE') : props.data.filter(item=>item.status==='CANCELLED') )}
                renderItem={renderData}
            />
        </View>
    );

};

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 18,
    },
    fareStyle: {
        fontSize: 18,
    },
    carNoStyle: {
        marginLeft: 45,
        fontSize: 13,
        marginTop: 10
    },
    picupStyle: {
        flexDirection: 'row',
    },
    picPlaceStyle: {
        color: colors.GREY.secondary
    },
    dropStyle: {
        flexDirection: 'row',
    },
    drpIconStyle: {
        color: colors.RED,
        fontSize: 20
    },
    dropPlaceStyle: {
        color: colors.GREY.secondary
    },
    greenDot: {
        alignSelf: 'center',
        borderRadius: 10,
        width: 10,
        height: 10,
        backgroundColor: colors.GREEN.default
    },
    redDot: {
        borderRadius: 10,
        width: 10,
        height: 10,
        backgroundColor: colors.RED

    },
    logoStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconClickStyle: {
        flex: 1,
        flexDirection: 'row'
    },
    flexViewStyle: {
        flex: 7,
        flexDirection: 'row',
        borderBottomColor: colors.GREY.secondary,
        borderBottomWidth: 1,
        marginTop: 10,
        marginLeft: 5
    },
    dateStyle: {
        fontFamily: 'Roboto-Bold',
        color: colors.GREY.default
    },
    carNoStyle: {
        fontFamily: 'Roboto-Regular',
        fontSize: 14,
        marginTop: 8,
        color: colors.GREY.default
    },
    placeStyle: {
        marginLeft: 10,
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
        alignSelf: 'center'
    },
    textViewStyle: {
        marginTop: 10,
        marginBottom: 10
    },
    cancelImageStyle: {
        width: 50,
        height: 50,
        marginRight: 20,
        marginTop: 18,
        alignSelf: 'flex-end'

    },
    iconViewStyle: {
        flex: 1, marginTop: 10
    },
    textView1: {
        flex: 5
    },
    textView2: {
        flex: 2
    },
    textView3: {
        flex: 1
    },
    position: {
        marginTop: 20
    },
    textPosition: {
        alignSelf: 'center'
    },
    segmentcontrol: {
        color: colors.WHITE,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 0,
        alignSelf: "center",
        height: 50
    }
});