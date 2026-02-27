#pragma once
#include "esphome/core/log.h"
#include "esphome/components/ble_client/ble_client.h"
#include "esp_gattc_api.h"

#include <vector>
#include <cstdint>

namespace ipixel_ble_writer {

static const char *TAG = "ipixel_ble_writer";

inline void write_cmd(esphome::ble_client::BLEClient *client,
                      const std::vector<uint8_t> &data) {
  // Cache voor de FA02-handle per BLE-verbinding
  static uint16_t s_fa02_handle = 0;      // 0 = onbekend
  static uint16_t s_last_conn_id = 0xFFFF;

  if (client == nullptr) {
    ESP_LOGW(TAG, "Client = null");
    return;
  }

  if (!client->connected()) {
    // Bij geen connectie cache resetten
    if (s_fa02_handle != 0) {
      ESP_LOGD(TAG, "Disconnected, clearing cached FA02 handle");
    }
    s_fa02_handle = 0;
    s_last_conn_id = 0xFFFF;
    ESP_LOGW(TAG, "Not connected, drop write");
    return;
  }

  // Huidige connectiegegevens
  uint16_t conn_id = client->get_conn_id();
  int gattc_if = client->get_gattc_if();

  // Bij nieuwe verbinding of nog geen handle → FA02 opzoeken
  if (s_fa02_handle == 0 || conn_id != s_last_conn_id) {
    auto *chr = client->get_characteristic(0x00FA, 0xFA02);
    if (chr == nullptr) {
      ESP_LOGW(TAG,
               "Characteristic 0xFA02 not found in service 0x00FA (conn_id=%u)",
               conn_id);
      return;
    }

    s_fa02_handle = chr->handle;
    s_last_conn_id = conn_id;
    ESP_LOGD(TAG,
             "Cached FA02 handle 0x%04X for conn_id=%u",
             s_fa02_handle, s_last_conn_id);
  }

  ESP_LOGD(TAG,
           "Write %d bytes to FA02 (handle 0x%04X)",
           (int) data.size(), s_fa02_handle);

  esp_err_t err = esp_ble_gattc_write_char(
      gattc_if,
      conn_id,
      s_fa02_handle,                // ✅ altijd de gecachete handle
      data.size(),
      (uint8_t *) data.data(),
      ESP_GATT_WRITE_TYPE_RSP,      // stabiel
      ESP_GATT_AUTH_REQ_NONE
  );

  if (err != ESP_OK) {
    ESP_LOGW(TAG, "Write FAILED: %s", esp_err_to_name(err));
  } else {
    ESP_LOGD(TAG, "Write OK (%d bytes)", (int) data.size());
  }
}

}  // namespace ipixel_ble_writer
