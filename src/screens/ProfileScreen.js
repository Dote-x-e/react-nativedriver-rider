import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    Text,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
    Switch,
    Platform,
    Share
} from 'react-native';
import { Icon, Header } from 'react-native-elements';
import ActionSheet from "react-native-actions-sheet";
import { colors } from '../common/theme';
import * as ImagePicker from 'expo-image-picker';
import i18n from 'i18n-js';
var { width, height } = Dimensions.get('window');
import { useSelector, useDispatch } from 'react-redux';
import { FirebaseContext } from 'common/src';
import StarRating from 'react-native-star-rating';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment/min/moment-with-locales';

export default function ProfileScreen(props) {
    const { t } = i18n;
    const { api } = useContext(FirebaseContext);
    const {
        updateProfileImage,
        signOut,
        deleteUser,
        updateProfile,
        clearTripPoints
    } = api;
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const settings = useSelector(state => state.settingsdata.settings);
    const [profileData, setProfileData] = useState(null);
    const [loader, setLoader] = useState(false);

    const actionSheetRef = useRef(null);

    const [langSelection, setLangSelection] = useState();
    const languagedata = useSelector(state => state.languagedata);

    

    useEffect(()=>{
        setLangSelection(i18n.locale);
    },[]);
    
    const LOCATION_TASK_NAME = 'background-location-task';

    useEffect(() => {
        if (auth.info && auth.info.profile) {
            setProfileData(auth.info.profile);
        }
    }, [auth.info]);

    const onChangeFunction = () => {
        let res = !profileData.driverActiveStatus;
        dispatch(updateProfile(auth.info, { driverActiveStatus: res }));
    }

    showActionSheet = () => {
        actionSheetRef.current?.setModalVisible(true);
    }

    uploadImage = () => {
        
        return (
            <ActionSheet ref={actionSheetRef}>
                <TouchableOpacity 
                    style={{width:'90%',alignSelf:'center',paddingLeft:20,paddingRight:20,borderColor:colors.GREY.iconPrimary,borderBottomWidth:1,height:60,alignItems:'center',justifyContent:'center'}} 
                    onPress={()=>{_pickImage('CAMERA', ImagePicker.launchCameraAsync)}}
                >
                    <Text style={{color:colors.BLUE.greenish_blue,fontWeight:'bold'}}>{t('camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={{width:'90%',alignSelf:'center',paddingLeft:20,paddingRight:20,borderBottomWidth:1,borderColor:colors.GREY.iconPrimary,height:60,alignItems:'center',justifyContent:'center'}} 
                    onPress={()=>{ _pickImage('MEDIA', ImagePicker.launchImageLibraryAsync)}}
                >
                    <Text  style={{color:colors.BLUE.greenish_blue,fontWeight:'bold'}}>{t('medialibrary')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                     style={{width:'90%',alignSelf:'center',paddingLeft:20,paddingRight:20, height:50,alignItems:'center',justifyContent:'center'}} 
                    onPress={()=>{actionSheetRef.current?.setModalVisible(false);}}>
                    <Text  style={{color:'red',fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
            </ActionSheet>
        )
    }

    _pickImage = async (permissionType, res) => {
        var pickFrom = res;
        let permisions;
        if(permissionType == 'CAMERA'){
            permisions = await ImagePicker.requestCameraPermissionsAsync();
        }else{
            permisions = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        const { status } = permisions;
        
        if (status == 'granted') {
            setLoader(true);
            let result = await pickFrom({
                allowsEditing: true,
                aspect: [3, 3],
                base64: true
            });
            actionSheetRef.current?.setModalVisible(false);
            if (!result.cancelled) {
                let data = 'data:image/jpeg;base64,' + result.base64;
                setProfileData({
                    ...profileData,
                    profile_image: result.uri
                })
                const blob = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        resolve(xhr.response);
                    };
                    xhr.onerror = function () {
                        Alert.alert(t('alert'), t('image_upload_error'));
                        setLoader(false);
                    };
                    xhr.responseType = 'blob';
                    xhr.open('GET', Platform.OS == 'ios' ? data : result.uri, true);
                    xhr.send(null);
                });
                if (blob) {
                    dispatch(updateProfileImage(auth.info, blob));
                }
                setLoader(false);
            }
            else {
                setLoader(false);
            }
        } else {
            Alert.alert(t('alert'), t('camera_permission_error'))
        }
    };


    editProfile = () => {
        props.navigation.push('editUser');
    }

    const StopBackgroundLocation = async () => {
        dispatch(updateProfile(auth.info, { driverActiveStatus: false }));
        TaskManager.getRegisteredTasksAsync().then((res)=>{
            if(res.length>0){
                for(let i=0;i<res.length;i++){
                    if(res[i].taskName == LOCATION_TASK_NAME){
                        Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                        break;
                    }
                }
            }
        });
    }

    //sign out and clear all async storage
    logOff = () => {
        auth.info && auth.info.profile && auth.info.profile.usertype == 'rider'? dispatch(clearTripPoints()):null;
        auth.info && auth.info.profile && auth.info.profile.usertype == 'driver'?  StopBackgroundLocation():null;
        props.navigation.navigate('Intro');
        setTimeout(() => {
            dispatch(signOut());
        }, 1000);  
    }

    //Delete current user
    deleteAccount = () => {
        Alert.alert(
            t('delete_account_modal_title'),
            t('delete_account_modal_subtitle'),
            [
                {
                    text: t('cancel'),
                    onPress: () => {},
                    style: 'cancel',
                },
                {
                    text: t('yes'), onPress: () => {
                        props.navigation.navigate('Intro');
                        dispatch(deleteUser(auth.info.uid));
                    }
                },
            ],
            { cancelable: false },
        );
    }

    goWallet = () => {
        props.navigation.navigate('wallet');
    }

    return (
        <View style={styles.mainView}>
            <Header
                backgroundColor={colors.GREY.default}
                leftComponent={{ icon: 'md-menu', type: 'ionicon', color: colors.WHITE, size: 30, component: TouchableWithoutFeedback, onPress: () => { props.navigation.toggleDrawer(); } }}
                centerComponent={<Text style={styles.headerTitleStyle}>{t('profile_page_title')}</Text>}
                containerStyle={styles.headerStyle}
                innerContainerStyles={{ marginLeft: 10, marginRight: 10 }}
                rightComponent={languagedata && languagedata.json? 
                    <View style={{ flexDirection:'row', height: 30, alignItems:'center'}}>
                        <Text style={{color:colors.WHITE}}>Lang:</Text>
                        {langSelection?
                        <RNPickerSelect
                            placeholder={{}}
                            value={langSelection}
                            useNativeAndroidPickerStyle={true}
                            style={{
                                inputIOS: styles.pickerStyle,
                                inputAndroid: styles.pickerStyle,
                                placeholder: {
                                    color: colors.WHITE
                                },
                                
                            }}
                            onValueChange={
                                (text) => {
                                    setLangSelection(text);
                                    i18n.locale = text;
                                    moment.locale(text);
                                    AsyncStorage.setItem('language',text);
                                }
                            }
                            label={"Language"}
                            items={Object.keys(languagedata.json).map(function(key){return {label :key, value: key};})}
                            Icon={() => {return <Ionicons style={{marginTop:4}} name="md-arrow-down" size={20} color="white" />;}}
                        />
                        :null}
                    </View>
                    :null
                }                
            />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollStyle}>
                {
                    uploadImage()
                }
                {profileData && profileData.usertype == 'driver' ?
                    <View style={styles.scrollViewStyle1} >
                        <Text style={styles.profStyle}>{t('active_status')}</Text>
                        <Switch
                            style={styles.switchAlignStyle}
                            value={profileData ? profileData.driverActiveStatus : false}
                            onValueChange={onChangeFunction}
                        />
                    </View>
                    : null}
                <View style={styles.scrollViewStyle} >
                    <Text style={styles.profStyle}>{t('profile_page_subtitle')}</Text>
                    <Icon
                        name='page-edit'
                        type='foundation'
                        color={colors.GREY.btnPrimary}
                        containerStyle={{ right: 20 }}
                        onPress={editProfile}
                    />
                </View>

                <View style={styles.viewStyle}>
                    <View style={styles.imageParentView}>
                        <View style={styles.imageViewStyle} >
                            {
                                loader ?
                                    <View style={[styles.loadingcontainer, styles.horizontal]}>
                                        <ActivityIndicator size="large" color={colors.BLUE.secondary} />
                                    </View>
                                    : <TouchableOpacity onPress={showActionSheet}>
                                        <Image source={profileData && profileData.profile_image ? { uri: profileData.profile_image } : require('../../assets/images/profilePic.png')} style={{ borderRadius: 130 / 2, width: 130, height: 130 }} />
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>
                    <Text style={styles.textPropStyle} >{profileData && profileData.firstName.toUpperCase() + " " + profileData.lastName.toUpperCase()}</Text>
                </View>

                <View style={styles.newViewStyle}>
                    <View style={styles.myViewStyle}>
                        <View style={styles.iconViewStyle}>
                            <Icon
                                name='envelope-letter'
                                type='simple-line-icon'
                                color={colors.GREY.btnPrimary}
                                size={30}
                            />
                            <Text style={styles.emailStyle}>{t('email_placeholder')}</Text>
                        </View>
                        <View style={styles.flexView1}>
                            <Text style={styles.emailAdressStyle}>{profileData ? profileData.email : ''}</Text>
                        </View>
                    </View>
                    <View style={styles.myViewStyle}>
                        <View style={styles.iconViewStyle}>
                            <Icon
                                name='phone-call'
                                type='feather'
                                color={colors.GREY.btnPrimary}
                            />
                            <Text style={styles.text1}>{t('mobile_no_placeholder')}</Text>
                        </View>
                        <View style={styles.flexView2}>
                            <Text style={styles.text2}>{profileData ? profileData.mobile : ''}</Text>
                        </View>
                    </View>
                    {profileData && profileData.referralId ?
                        <View style={styles.myViewStyle}>
                            <View style={styles.iconViewStyle}>
                                <Icon
                                    name='award'
                                    type='feather'
                                    color={colors.GREY.btnPrimary}
                                />
                                <Text style={styles.emailStyle}>{t('referralId')}</Text>
                            </View>
                            <View style={{ flex: 1, flexDirection:'row' }}>
                                <Text style={styles.text2}>{profileData.referralId}</Text>
                                <TouchableOpacity 
                                    style={{marginLeft: 20}}
                                    onPress={()=>{
                                        settings.bonus>0?
                                        Share.share({
                                            message: t('share_msg ')+ settings.code + ' ' + settings.bonus + ".\n"  +  t('code_colon') +  auth.info.profile.referralId  + "\n" + t('app_link') + (Platform.OS=="ios"? settings.AppleStoreLink : settings.PlayStoreLink)
                                        })
                                        :
                                        Share.share({
                                            message: t('share_msg_no_bonus') + "\n"  + t('app_link') + (Platform.OS=="ios"? settings.AppleStoreLink : settings.PlayStoreLink)
                                        })
                                    }}
                                >
                                    <Icon
                                        name={Platform.OS == 'android'? 'share-social' : 'share'}
                                        type='ionicon'
                                        color={colors.BLUE.secondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        : null}
                    <View style={styles.myViewStyle}>
                        <View style={styles.iconViewStyle}>
                            <Icon
                                name='user'
                                type='simple-line-icon'
                                color={colors.GREY.btnPrimary}
                            />
                            <Text style={styles.emailStyle}>{t('usertype')}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.text2}>{profileData ? t(profileData.usertype) : ''}</Text>
                        </View>
                    </View>
                    {profileData && profileData.usertype == 'driver'?
                    <View style={styles.myViewStyle}>
                        <View style={styles.iconViewStyle}>
                            <Icon
                                name='car-outline'
                                type='ionicon'
                                color={colors.GREY.btnPrimary}
                            />
                            <Text style={styles.emailStyle}>{t('car_type')}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.text2}>{profileData.carType}</Text>
                        </View>
                    </View>
                    :null}
                    {profileData && profileData.usertype == 'driver'?
                    <View style={styles.myViewStyle}>
                        <View style={styles.iconViewStyle}>
                            <Icon
                                name='thumbs-up-outline'
                                type='ionicon'
                                color={colors.GREY.btnPrimary}
                            />
                            <Text style={styles.emailStyle}>{t('you_rated_text')}</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection:'row' }}>
                            <Text style={styles.text2}>{profileData && profileData.usertype && profileData.ratings? profileData.ratings.userrating:0}</Text>
                            <StarRating
                                disabled={false}
                                maxStars={5}
                                starSize={15}
                                fullStar={'ios-star'}
                                halfStar={'ios-star-half'}
                                emptyStar={'ios-star-outline'}
                                iconSet={'Ionicons'}
                                fullStarColor={colors.YELLOW.primary}
                                emptyStarColor={colors.YELLOW.primary}
                                halfStarColor={colors.YELLOW.primary}
                                rating={profileData && profileData.usertype && profileData.ratings? parseFloat(profileData.ratings.userrating):0}
                                containerStyle={styles.contStyle}
                            />
                        </View>
                    </View>
                    :null}
                </View>

                <View style={styles.flexView3}>

                    <TouchableOpacity style={styles.textIconStyle2} onPress={deleteAccount}>
                        <Text style={styles.emailStyle}>{t('delete_account_lebel')}</Text>
                        <Icon
                            name='ios-arrow-forward'
                            type='ionicon'
                            color={colors.GREY.iconPrimary}
                            size={35}
                            containerStyle={{ right: 20 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={logOff} style={styles.textIconStyle2}>
                        <Text style={styles.emailStyle}>{t('logout')}</Text>
                        <Icon
                            name='ios-arrow-forward'
                            type='ionicon'
                            color={colors.GREY.iconPrimary}
                            size={35}
                            containerStyle={{ right: 20 }}
                        />
                    </TouchableOpacity>
                </View>

            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.GREY.default,
        borderBottomWidth: 0
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    logo: {
        flex: 1,
        position: 'absolute',
        top: 110,
        width: '100%',
        justifyContent: "flex-end",
        alignItems: 'center'
    },
    footer: {
        flex: 1,
        position: 'absolute',
        bottom: 0,
        height: 150,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    scrollStyle: {
        flex: 1,
        height: height,
        backgroundColor: colors.WHITE
    },
    scrollViewStyle1: {
        width: width,
        height: 50,
        marginTop: 20,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    scrollViewStyle: {
        width: width,
        height: 50,
        marginTop: 30,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    profStyle: {
        fontSize: 18,
        left: 20,
        fontWeight: 'bold',
        color: colors.GREY.btnPrimary,
        fontFamily: 'Roboto-Bold'
    },
    bonusAmount: {
        right: 20,
        fontSize: 16,
        fontWeight: 'bold'
    },
    viewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 13
    },
    imageParentView: {
        borderRadius: 150 / 2,
        width: 150,
        height: 150,
        backgroundColor: colors.GREY.secondary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageViewStyle: {
        borderRadius: 140 / 2,
        width: 140,
        height: 140,
        backgroundColor: colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textPropStyle: {
        fontSize: 21,
        fontWeight: 'bold',
        color: colors.GREY.iconSecondary,
        fontFamily: 'Roboto-Bold',
        top: 8,
        textTransform: 'uppercase'
    },
    newViewStyle: {
        flex: 1,
        marginTop: 10
    },
    myViewStyle: {
        flex: 1,
        left: 20,
        marginRight: 40,
        marginBottom: 8,
        borderBottomColor: colors.GREY.btnSecondary,
        borderBottomWidth: 1
    },
    iconViewStyle: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center'
    },
    emailStyle: {
        fontSize: 17,
        left: 10,
        color: colors.GREY.btnPrimary,
        fontFamily: 'Roboto-Bold'
    },
    emailAdressStyle: {
        fontSize: 15,
        color: colors.GREY.secondary,
        fontFamily: 'Roboto-Regular'
    },
    mainIconView: {
        flex: 1,
        left: 20,
        marginRight: 40,
        borderBottomColor: colors.GREY.iconSecondary,
        borderBottomWidth: 1
    },
    text1: {
        fontSize: 17,
        left: 10,
        color: colors.GREY.btnPrimary,
        fontFamily: 'Roboto-Bold'
    },
    text2: {
        fontSize: 15,
        left: 10,
        color: colors.GREY.secondary,
        fontFamily: 'Roboto-Regular'
    },
    textIconStyle: {
        width: width,
        height: 50,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    textIconStyle2: {
        width: width,
        height: 50,
        marginTop: 10,
        backgroundColor: colors.GREY.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
        //marginTop: StatusBar.currentHeight 
    },
    flexView1: {
        flex: 1
    },
    flexView2: {
        flex: 1
    },
    flexView3: {
        marginTop: 10
    },
    loadingcontainer: {
        flex: 1,
        justifyContent: 'center'
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10
    },
    contStyle: {
        width:90,
        marginLeft: 20
    },
    pickerStyle: {
        color: colors.WHITE,
        width:50,
        fontSize: 20,
        height: 30,
        marginLeft:3,
        alignContent:'center',
        justifyContent: 'center',
        fontWeight:'bold'
    }
});