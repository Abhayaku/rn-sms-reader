import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
} from 'react-native';

/**
 * Error message displayed when the package 'rn-sms-reader' is not linked.
 * Instructions for linking are provided based on the platform.
 */
const ERROR_MESSAGE =
  `The package 'rn-sms-reader' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go';

/**
 * Access the RnSmsReader module or throw an error if not linked.
 */
const RnSmsReader = NativeModules.RnSmsReader
  ? NativeModules.RnSmsReader
  : new Proxy(
      {},
      {
        get() {
          throw new Error(ERROR_MESSAGE);
        },
      }
    );

/**
 * Define SMS permissions for checking and requesting.
 */
const receiveSmsPermission: any = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;
const readSmsPermission: any = PermissionsAndroid.PERMISSIONS.READ_SMS;

/**
 * Extracts OTP from SMS text using a regular expression.
 * @param text - SMS text from which OTP is to be extracted.
 * @param otpLength - Length of the OTP to be extracted.
 * @returns Extracted OTP or null if not found.
 */
const extractOtpFromText = (text: string, otpLength: number) => {
  const regex = new RegExp(`\\b\\d{${otpLength}}\\b`);
  const match = text.match(regex);
  return match ? match[0] : null;
};

/**
 * RnSmsService provides functions to check, request SMS permissions,
 * and fetch SMS messages to extract OTP.
 */
const RnSmsService = {
  /**
   * Checks if SMS permissions are already granted.
   * @returns A Promise that resolves to true if both permissions are granted, false otherwise.
   */
  checkingSmsPermission: async (): Promise<boolean> => {
    const receiveSmsGranted =
      await PermissionsAndroid.check(receiveSmsPermission);
    const readSmsGranted = await PermissionsAndroid.check(readSmsPermission);
    return receiveSmsGranted && readSmsGranted;
  },

  /**
   * Requests SMS permissions and returns a Promise indicating success.
   * @returns A Promise that resolves to true if permissions are granted, false otherwise.
   */
  requestSmsPermission: async (): Promise<boolean> => {
    try {
      const checkPermission = await RnSmsService.checkingSmsPermission();

      if (checkPermission) {
        return true;
      } else {
        const granted: any = await PermissionsAndroid.requestMultiple([
          receiveSmsPermission,
          readSmsPermission,
        ]);

        if (
          granted[receiveSmsPermission] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[readSmsPermission] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Read SMS permission granted::: ', granted);
          return true;
        } else {
          console.log('Read SMS permission denied::: ', granted);
          return false;
        }
      }
    } catch (error) {
      console.error('Error requesting SMS permissions::: ', error);
      return false;
    }
  },

  /**
   * Fetches SMS messages and extracts OTP.
   * @param length - Length of the OTP to be extracted from the SMS.
   * @returns A Promise that resolves to an object containing the extracted OTP or undefined.
   */
  fetchSms: async (length: number): Promise<{ otp: string | undefined }> => {
    return new Promise(async (resolve) => {
      let otp: string | undefined | any = undefined;
      const status = await RnSmsService.requestSmsPermission();

      if (status) {
        try {
          RnSmsReader.initiateSmsReading(
            () => {
              const subscription = new NativeEventEmitter(
                RnSmsReader
              ).addListener('on_sms_received', (sms: string) => {
                otp = extractOtpFromText(sms, length);
                subscription.remove();
                console.log('OTP::: ', otp);
                resolve({ otp });
              });
            },
            (error: string) => {
              console.log('Error while reading SMS::: ', error);
              resolve({ otp });
            }
          );
        } catch (error) {
          console.log('Error while reading SMS::: ', error);
          resolve({ otp });
        }
      } else {
        resolve({ otp });
      }
    });
  },
};

export default RnSmsService;
