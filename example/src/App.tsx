import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import RnSmsService from 'rn-sms-reader';

export default function App() {
  const otpLength = 6;
  const [message, setMessage] = useState<string>('');
  const [isPermission, setIsPermission] = useState<boolean>(false);
  const [otp, setOTP] = useState<string | null>(null);
  const [isIntervalActive, setIsIntervalActive] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  // check for SMS permission
  const checkPermission = async () => {
    const permission = await RnSmsService.checkingSmsPermission();
    if (!permission) {
      setIsPermission(false);
      setMessage(
        'SMS permission is required. Please click the button below to grant permission.'
      );
    } else {
      setIsPermission(true);
      setMessage(
        'SMS permission granted. Please click the button below to fetch SMS.'
      );
    }
  };

  useEffect(() => {
    let intervalId: any;

    if (isIntervalActive) {
      intervalId = setInterval(() => {
        if (otp) {
          clearInterval(intervalId);
        } else {
          fetchSMS();
        }
      }, 1000);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isIntervalActive, otp]);

  // fetch SMS
  const fetchSMS = async () => {
    if (!otp) {
      setIsIntervalActive(true);
      try {
        setMessage('Fetching SMS, Please wait.....');
        const result = await RnSmsService.fetchSms(otpLength);
        if (result && result.otp) {
          setOTP(result.otp);
        }
      } catch (error) {
        console.error('Error fetching SMS:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {otp ? `Your OTP is :::: ${otp}` : message}
      </Text>
      <TouchableOpacity onPress={fetchSMS} style={styles.button}>
        <Text style={styles.buttonText}>
          {isPermission ? 'Fetch SMS' : 'Grant Permission & Fetch SMS'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  text: {
    color: '#000',
    fontSize: 23,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
  },
});
