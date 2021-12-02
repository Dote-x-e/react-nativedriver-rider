import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import i18n from 'i18n-js';
import { useSelector, useDispatch } from "react-redux";
import { FirebaseContext } from 'common/src';

export default function AuthLoadingScreen(props) {
  const { t } = i18n;
  const { api } = useContext(FirebaseContext);
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const languagedata = useSelector(state => state.languagedata);
  const settings = useSelector(state => state.settingsdata.settings);

  useEffect(() => {
    if (auth.info && languagedata &&  languagedata.json && settings) {
      if (auth.info.profile) {
        let role = auth.info.profile.usertype;
        if (auth.info.profile.approved) {
          if (role === 'rider') {
            dispatch(api.monitorProfileChanges());
            dispatch(api.fetchDrivers());
            dispatch(api.fetchBookings(auth.info.uid, role));
            dispatch(api.fetchCancelReasons());
            dispatch(api.fetchPaymentMethods());
            dispatch(api.fetchPromos());
            props.navigation.navigate('RiderRoot');
          } else if (role === 'driver') {
            dispatch(api.monitorProfileChanges());
            dispatch(api.fetchBookings(auth.info.uid, role));
            dispatch(api.fetchPaymentMethods());
            dispatch(api.fetchTasks());
            props.navigation.navigate('DriverRoot');
          } else if (role === 'admin' || role == 'fleetadmin') {
            props.navigation.navigate('AdminRoot');
          }
          else {
            Alert.alert(t('alert'), t('not_valid_user_type'));
            dispatch(api.signOut());
            props.navigation.navigate('Intro');
          }
        }
        else {
          Alert.alert(t('alert'), t('require_approval'));
          dispatch(api.signOut());
          props.navigation.navigate('Intro');
        }
      }else{
        Alert.alert(t('alert'), t('user_issue_contact_admin'));
        dispatch(api.signOut());
        props.navigation.navigate('Intro');
      }
    }
  }, [auth.info,languagedata,languagedata.json,settings]);


  useEffect(() => {
    if (api && languagedata &&  languagedata.json && auth.error && auth.error.msg && !auth.info && settings) {
      dispatch(api.clearLoginError());
      props.navigation.navigate('Intro');
    }
  }, [auth.error,auth.error.msg,languagedata &&  languagedata.json, settings]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/intro.jpg')}
        resizeMode="stretch"
        style={styles.imagebg}
      >
        <ActivityIndicator />
        <Text style={{ paddingBottom: 100 }}>Fetching Data...</Text>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center'
  },
  imagebg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: "flex-end",
    alignItems: 'center'
  }
});