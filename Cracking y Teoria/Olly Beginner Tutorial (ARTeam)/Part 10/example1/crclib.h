#define CRC_START_BLOCK(label) void label(void) { }
#define CRC_END_BLOCK(label) void _##label(void) { }
#define CRC_BLOCK_LEN(label) (int)_##label - (int)label
#define CRC_BLOCK_ADDR(label) (unsigned char *)label

static unsigned long crc32_table[256] = {0};

#define CRC_TABLE_LEN 256
#define CRC_POLY 0xEDB88320L

static int crc32(unsigned long a, unsigned long b) {
    int idx, prev;

    prev = (a >> 8) & 0x00FFFFFF;
    idx = (a ^ b) & 0xFF;
    return (prev ^ crc32_table[idx] ^ 0xFFFFFFFF);
}

static unsigned long crc32_table_init(void) {
    int i, j;
    unsigned long crc;

    for (i = 0; i < CRC_TABLE_LEN; i++) {
        crc = i;
        for (j = 8; j > 0; j--) {
            if (crc & 1) crc = (crc >> 1) ^ CRC_POLY;
            else crc >>= 1;
        }
        crc32_table[i] = crc;
    }
    return 1;
} 

unsigned long crc32_calc(unsigned char *buf, int buf_len) {
    int x;
    unsigned long crc = 0xFFFFFFFF;

    if (!crc32_table[0]) crc32_table_init( );
    for (x = 0; x < buf_len; x++) crc = crc32(crc, buf[x]);
    return crc;
}