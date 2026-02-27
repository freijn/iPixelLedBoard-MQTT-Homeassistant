#pragma once
#include <vector>
#include <cstdint>
#include <string>
#include <map>
#include "Font.h"

namespace ipixel {

// Bitreverse voor 16 bit
inline uint16_t reverseBits16(uint16_t n) {
    n = ((n & 0x5555) << 1) | ((n >> 1) & 0x5555);
    n = ((n & 0x3333) << 2) | ((n >> 2) & 0x3333);
    n = ((n & 0x0F0F) << 4) | ((n >> 4) & 0x0F0F);
    n = ((n & 0x00FF) << 8) | ((n >> 8) & 0x00FF);
    return n;
}

// Byte-swap helper (switchEndian voor uint16_t naar twee bytes)
inline void pushLE(std::vector<uint8_t>& vec, uint16_t val) {
    vec.push_back(val & 0xFF);
    vec.push_back((val >> 8) & 0xFF);
}

// Tekst -> glyph-data per karakter, bitvolgorde + bytes LE (Matrix verwacht dit)
inline std::vector<uint8_t> encode_text(const std::string& text,
                                        int matrix_height,
                                        uint8_t r, uint8_t g, uint8_t b) {
    std::vector<uint8_t> frame;
    uint8_t matrix_height_byte = static_cast<uint8_t>(matrix_height);

    for (char character : text) {
        auto it = FONT_VCR_OSD_MONO_16PX.find(character);
        if (it == FONT_VCR_OSD_MONO_16PX.end()) continue;

        const FontChar& fontChar = it->second;
        std::vector<uint8_t> char_bytes;
        for (uint16_t line_data : fontChar.data) {
            uint16_t reversed = reverseBits16(line_data);          // Bits spiegelen
            char_bytes.push_back(reversed & 0xFF);                 // LOW byte eerst!
            char_bytes.push_back((reversed >> 8) & 0xFF);          // HIGH byte tweede
        }
        uint8_t char_width_byte = static_cast<uint8_t>(fontChar.width);

        frame.push_back(0x80);
        frame.push_back(r);
        frame.push_back(g);
        frame.push_back(b);
        frame.push_back(char_width_byte);
        frame.push_back(matrix_height_byte);
        frame.insert(frame.end(), char_bytes.begin(), char_bytes.end());
    }

    return frame;
}

// CRC32 standaard
inline uint32_t crc32_basic(const std::vector<uint8_t>& data) {
    uint32_t crc = 0xFFFFFFFFu;
    for (uint8_t b : data) {
        crc ^= b;
        for (int i = 0; i < 8; ++i) {
            if (crc & 1u) {
                crc = (crc >> 1) ^ 0xEDB88320u;
            } else {
                crc >>= 1;
            }
        }
    }
    return ~crc;
}
inline std::vector<uint8_t> crc32_bytes_le(const std::vector<uint8_t>& data) {
    uint32_t crc = crc32_basic(data);
    std::vector<uint8_t> out(4);
    out[0] = static_cast<uint8_t>(crc & 0xFF);
    out[1] = static_cast<uint8_t>((crc >> 8) & 0xFF);
    out[2] = static_cast<uint8_t>((crc >> 16) & 0xFF);
    out[3] = static_cast<uint8_t>((crc >> 24) & 0xFF);
    return out;
}

// Volledige MG-text frame bouwen
inline std::vector<uint8_t> build_text_frame(const std::string& text,
                                             int animation,
                                             int save_slot,
                                             int speed,
                                             uint8_t r,
                                             uint8_t g,
                                             uint8_t b,
                                             int rainbow_mode,
                                             int matrix_height) {
    const std::size_t len = text.size();
    if (len == 0 || len > 100) return {};
    if (animation == 3 || animation == 4) return {};
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
    uint16_t header_gap = static_cast<uint16_t>(0x06 + matrix_height * 0x02);

    uint16_t header_1_val = static_cast<uint16_t>(HEADER_1_MG + len * header_gap);
    uint16_t header_3_val = static_cast<uint16_t>(HEADER_3_MG + len * header_gap);

    std::vector<uint8_t> header;
    pushLE(header, header_1_val); // Byte 1-2
    header.push_back(0x00);       // 3
    header.push_back(0x01);       // 4
    header.push_back(0x00);       // 5
    pushLE(header, header_3_val); // 6-7
    header.push_back(0x00);       // 8
    header.push_back(0x00);       // 9

    // === SAVE SLOT ===
    uint16_t save_slot_val = static_cast<uint16_t>(save_slot);
    std::vector<uint8_t> save_slot_bytes;
    pushLE(save_slot_bytes, save_slot_val);

    // === PAYLOAD ===
    std::vector<uint8_t> payload;
    payload.push_back(static_cast<uint8_t>(len));
    payload.push_back(0x00);
    payload.push_back(0x01);
    payload.push_back(0x01);
    payload.push_back(static_cast<uint8_t>(animation));
    payload.push_back(static_cast<uint8_t>(speed));
    payload.push_back(static_cast<uint8_t>(rainbow_mode));
    // ffffff00000000
    payload.push_back(0xFF);
    payload.push_back(0xFF);
    payload.push_back(0xFF);
    payload.push_back(0x00);
    payload.push_back(0x00);
    payload.push_back(0x00);
    payload.push_back(0x00);
    // Glyph data: BITREVERSE / LOW-HIGH
    std::vector<uint8_t> chars_bytes = encode_text(text, matrix_height, r, g, b);
    payload.insert(payload.end(), chars_bytes.begin(), chars_bytes.end());

    // CRC over payload (LE)
    std::vector<uint8_t> crc_bytes = crc32_bytes_le(payload);

    // === FRAME COMBINER ===
    std::vector<uint8_t> result;
    result.insert(result.end(), header.begin(), header.end());
    result.insert(result.end(), crc_bytes.begin(), crc_bytes.end());
    result.insert(result.end(), save_slot_bytes.begin(), save_slot_bytes.end());
    result.insert(result.end(), payload.begin(), payload.end());

    return result;
}

// Clear / terug naar LED-logo
inline std::vector<uint8_t> build_clear_frame() {
    std::vector<uint8_t> frame(4);
    frame[0] = 0x04;
    frame[1] = 0x00;
    frame[2] = 0x03;
    frame[3] = 0x80;
    return frame;
}

} // namespace ipixel