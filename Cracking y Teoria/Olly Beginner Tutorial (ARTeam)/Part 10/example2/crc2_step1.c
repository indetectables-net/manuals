#include <stdio.h>
#include "crclib.h"
   
CRC_START_BLOCK(test)
int test_routine(int a) {
  while (a < 12) a = (a - (a * 3)) + 1;
  return a;
}
CRC_END_BLOCK(test)
   
typedef void (*crc_check_fn)(unsigned long *);
   
static void crc_check(unsigned long *crc); 
static void crc_nib2 (unsigned long *crc); 
static void crc_nib3 (unsigned long *crc); 
static void crc_nib4 (unsigned long *crc); 
static void crc_nib5 (unsigned long *crc); 
static void crc_nib6 (unsigned long *crc); 
static void crc_nib7 (unsigned long *crc); 
static void crc_nib8 (unsigned long *crc);
   
crc_check_fn b1[16] = {0,}, b2[16] = {0,}, b3[16] = {0,}, b4[16] = {0,},
             b5[16] = {0,}, b6[16] = {0,}, b7[16] = {0,}, b8[16] = {0,};
   
#define CRC_TABLE_LOOKUP(table)             \
          int          index = *crc & 0x0F; \
          crc_check_fn next = table[index]; \
          *crc >>= 4;                       \
          (*next)(crc)
   
static void crc_check(unsigned long *crc) { CRC_TABLE_LOOKUP(b1); }
static void crc_nib2 (unsigned long *crc) { CRC_TABLE_LOOKUP(b2); }
static void crc_nib3 (unsigned long *crc) { CRC_TABLE_LOOKUP(b3); }
static void crc_nib4 (unsigned long *crc) { CRC_TABLE_LOOKUP(b4); }
static void crc_nib5 (unsigned long *crc) { CRC_TABLE_LOOKUP(b5); }
static void crc_nib6 (unsigned long *crc) { CRC_TABLE_LOOKUP(b6); }
static void crc_nib7 (unsigned long *crc) { CRC_TABLE_LOOKUP(b7); }
static void crc_nib8 (unsigned long *crc) { CRC_TABLE_LOOKUP(b8); }
   
static void crc_good(unsigned long *crc) {
  printf("CRC is valid.\n");
}
   
int main(int argc, char *argv[  ]) {
  unsigned long crc;
   
  crc = crc32_calc(CRC_BLOCK_ADDR(test), CRC_BLOCK_LEN(test));
#ifdef TEST_BUILD
  printf("CRC32 %#08X\n", crc);
#else
  crc_check(&crc);
#endif
  return 0;
}
