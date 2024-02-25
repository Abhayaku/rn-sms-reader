package com.rnsmsreader;

import androidx.annotation.NonNull;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;
import android.Manifest;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.facebook.react.module.annotations.ReactModule;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.telephony.SmsMessage;
import androidx.core.content.ContextCompat;

@ReactModule(name = RnSmsReaderModule.NAME)
public class RnSmsReaderModule extends ReactContextBaseJavaModule {
  public static final String NAME = "RnSmsReader";

  private static ReactApplicationContext customReactContext;
  private BroadcastReceiver msgReceiver;

  public RnSmsReaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
    customReactContext = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void initiateSmsReading(final Callback success, final Callback error) {
    try {
      if (ContextCompat.checkSelfPermission(customReactContext,
          Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED &&
          ContextCompat.checkSelfPermission(customReactContext,
              Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
        msgReceiver = new BroadcastReceiver() {
          @Override
          public void onReceive(Context context, Intent intent) {
            customReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("on_sms_received", getMessageFromMessageIntent(intent));
          }
        };
        String SMS_RECEIVED_ACTION = "android.provider.Telephony.SMS_RECEIVED";
        customReactContext.registerReceiver(msgReceiver, new IntentFilter(SMS_RECEIVED_ACTION));
        success.invoke("SMS reading initiated successfully.");
      } else {
        error.invoke("Required RECEIVE_SMS and READ_SMS permission. Please grant permission in the settings.");
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private String getMessageFromMessageIntent(Intent intent) {
    StringBuilder message = new StringBuilder();

    try {
      Bundle bundle = intent.getExtras();
      if (bundle != null) {
        Object[] pdusObj = (Object[]) bundle.get("pdus");
        if (pdusObj != null) {
          for (Object aPdusObj : pdusObj) {
            SmsMessage currentMessage = SmsMessage.createFromPdu((byte[]) aPdusObj);
            if (currentMessage != null) {
              message.append(currentMessage.getMessageBody());
            }
          }
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }

    return message.toString();
  }

}
