import React from 'react';
import { 
    Text,
    View,
    Modal,
    Image
  } from 'react-native';
import { colors } from '../common/theme';
import i18n from 'i18n-js';

export function LoadingModal(props){
    const { loadingModal } = props;
    const { t } = i18n;
    return (
    <Modal
        animationType="fade"
        transparent={true}
        visible={loadingModal}
    >
        <View style={{ flex: 1, backgroundColor: "rgba(22,22,22,0.8)", justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '85%', backgroundColor: colors.GREY.Smoke_Grey, borderRadius: 10, flex: 1, maxHeight: 70 }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: "center" }}>
                    <Image
                        style={{ width: 80, height: 80, backgroundColor: colors.TRANSPARENT }}
                        source={require('../../assets/images/loader.gif')}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.BLACK, fontSize: 16, }}>{t('driver_finding_alert')}</Text>
                    </View>
                </View>
            </View>
        </View>
    </Modal>
    );
}
