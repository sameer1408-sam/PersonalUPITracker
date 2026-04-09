package com.personalupitracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native module that listens for incoming SMS messages
 * and emits events to the React Native JavaScript layer.
 *
 * Emits "onSMSReceived" event with {sender: string, body: string}
 */
class SmsListenerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var receiver: BroadcastReceiver? = null
    private var listenerCount = 0

    override fun getName(): String = "SmsListenerModule"

    /**
     * Register the BroadcastReceiver when JS starts listening
     */
    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
        if (listenerCount == 1) {
            registerSmsReceiver()
        }
    }

    /**
     * Unregister when JS stops listening
     */
    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount <= 0) {
            listenerCount = 0
            unregisterSmsReceiver()
        }
    }

    private fun registerSmsReceiver() {
        if (receiver != null) return

        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

                try {
                    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                    // Concatenate multi-part SMS
                    val fullBody = StringBuilder()
                    var sender: String? = null

                    for (message in messages) {
                        if (sender == null) {
                            sender = message.originatingAddress
                        }
                        fullBody.append(message.messageBody)
                    }

                    val body = fullBody.toString()
                    if (body.isBlank()) return

                    val params: WritableMap = Arguments.createMap()
                    params.putString("sender", sender ?: "unknown")
                    params.putString("body", body)

                    sendEvent("onSMSReceived", params)
                } catch (e: Exception) {
                    // Never crash on malformed SMS
                    e.printStackTrace()
                }
            }
        }

        val intentFilter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        intentFilter.priority = IntentFilter.SYSTEM_HIGH_PRIORITY

        // SMS broadcasts come from the system (external), so we must use RECEIVER_EXPORTED
        // on Android 13+ (API 33 / Tiramisu) to receive them
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.registerReceiver(
                receiver,
                intentFilter,
                Context.RECEIVER_EXPORTED
            )
        } else {
            reactApplicationContext.registerReceiver(receiver, intentFilter)
        }
    }

    private fun unregisterSmsReceiver() {
        if (receiver != null) {
            try {
                reactApplicationContext.unregisterReceiver(receiver)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            receiver = null
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            // React context might not be ready yet
            e.printStackTrace()
        }
    }

    /**
     * Clean up when the module is destroyed
     */
    override fun invalidate() {
        unregisterSmsReceiver()
        super.invalidate()
    }
}
