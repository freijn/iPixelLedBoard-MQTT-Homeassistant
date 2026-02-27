#pragma once

#include <vector>
#include <cstdint>
#include <string>

#include "ipixel_text.h"  // gebruikt reverseBits16, pushLE, encode_text, crc32_bytes_le

namespace ipixel {

/**
 * v2-variant van het tekstframe:
 *
 * - GEEN harde limiet meer op tekstlengte (alleen empty check)
 * - zelfde MG-structuur als je Python matrix_text.py
 * - defensieve clamps op animatie, speed, save_slot, rainbow, hoogte
 *
 * Let op:
 *  - Als de matrix of BLE-stack intern grenzen heeft, kunnen die nog steeds
 *    de maximale lengte bepalen. Aan onze kant blokkeren we niets meer.
 */
inline std::vector<uint8_t> build_text_frame_v2(
    const std::string &text,
    int animation,
    int save_slot,
    int speed,
    uint8_t r,
    uint8_t g,
    uint8_t b,
    int rainbow_mode,
    int matrix_height
) {
    const std::size_t len = text.size();

    // Alleen echt lege tekst blokkeren
    if (len == 0) {
        return {};
    }

    // In jouw Python-versie werden animatie 3 en 4 uitgefilterd.
    // Om compatibel te blijven, mappen we ze terug naar 0 (scroll default)
    if (animation == 3 || animation == 4) {
        animation = 0;
    }

    // Clamps (zoals in matrix_text.py / ipixel_text.h)
    if (animation < 0) animation = 0;
    if (animation > 7) animation = 7;

    if (save_slot < 1) save_slot = 1;
    if (save_slot > 10) save_slot = 10;

    if (speed < 0) speed = 0;
    if (speed > 100) speed = 100;

    if (rainbow_mode < 0) rainbow_mode = 0;
    if (rainbow_mode > 9) rainbow_mode = 9;

    if (matrix_height < 0) matrix_height = 0;
    if (matrix_height > 255) matrix_height = 255;

    // === HEADER (LE bytes!) ===
    const uint16_t HEADER_1_MG = 0x1D;
    const uint16_t HEADER_3_MG = 0x0E;

    // 0x06 + (matrix_height * 2) zoals in jouw Python encoder
    uint16_t header_gap = static_cast<uint16_t>(0x06 + matrix_height * 0x02);

    // Let op: hier gebruiken we het AANTAL karakters (len), net als in matrix_text.py
    uint16_t header_1_val =
        static_cast<uint16_t>((HEADER_1_MG + static_cast<uint16_t>(len) * header_gap) & 0xFFFF);
    uint16_t header_3_val =
        static_cast<uint16_t>((HEADER_3_MG + static_cast<uint16_t>(len) * header_gap) & 0xFFFF);

    std::vector<uint8_t> header;
    pushLE(header, header_1_val);   // bytes 1-2
    header.push_back(0x00);         // 3
    header.push_back(0x01);         // 4
    header.push_back(0x00);         // 5
    pushLE(header, header_3_val);   // 6-7
    header.push_back(0x00);         // 8
    header.push_back(0x00);         // 9

    // === SAVE SLOT ===
    uint16_t save_slot_val = static_cast<uint16_t>(save_slot);
    std::vector<uint8_t> save_slot_bytes;
    pushLE(save_slot_bytes, save_slot_val & 0xFFFF);

    // === PAYLOAD ===
    std::vector<uint8_t> payload;

    // Eerste 7 bytes + kleurblok (exact als matrix_text.py)
    payload.push_back(static_cast<uint8_t>(len & 0xFF));  // aantal karakters
    payload.push_back(0x00);
    payload.push_back(0x01);
    payload.push_back(0x01);
    payload.push_back(static_cast<uint8_t>(animation & 0xFF));
    payload.push_back(static_cast<uint8_t>(speed & 0xFF));
    payload.push_back(static_cast<uint8_t>(rainbow_mode & 0xFF));

    // ffffff00000000, vaste kleur-reserve blok
    payload.push_back(0xFF);
    payload.push_back(0xFF);
    payload.push_back(0xFF);
    payload.push_back(0x00);
    payload.push_back(0x00);
    payload.push_back(0x00);
    payload.push_back(0x00);

    // Glyph data via bestaande encode_text() (zelfde layout als Python _encode_text_bytes)
    std::vector<uint8_t> chars_bytes = encode_text(text, matrix_height, r, g, b);
    payload.insert(payload.end(), chars_bytes.begin(), chars_bytes.end());

    // CRC over payload (LE)
    std::vector<uint8_t> crc_bytes = crc32_bytes_le(payload);

    // === FRAME SAMENVOEGEN ===
    std::vector<uint8_t> result;
    result.insert(result.end(), header.begin(), header.end());
    result.insert(result.end(), crc_bytes.begin(), crc_bytes.end());
    result.insert(result.end(), save_slot_bytes.begin(), save_slot_bytes.end());
    result.insert(result.end(), payload.begin(), payload.end());

    return result;
}

}  // namespace ipixel
