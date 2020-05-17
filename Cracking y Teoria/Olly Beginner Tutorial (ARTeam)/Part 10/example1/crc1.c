#include <stdio.h>
#include "crclib.h"

CRC_START_BLOCK(test)
int test_routine(int a) {
    while (a < 12) a = (a - (a * 3)) + 1;
return a;
}
CRC_END_BLOCK( test )

int main(int argc, char *argv[ ]) {

    unsigned long crc=0;
    unsigned long crc_stored=0;

    /* warning: replace the 0xFFFFFFFF value at "crc32_stored" with the real checksum! */ 
    /* With respect to the code explained in the tutorial, there are some differencies, just because
     * the Visual C++ 6.0 I used doesn't support the standard asm C operator. I had to use instead the
     *__asm operator which has some clearly documented limitations. First of all is not possible to 
     * directly define variables using the DB directive. I have to use instead the pseudoinstruction
     * _emit which force the compiler to emit the specified bytes, simulating so the DB directive.
     * The ASM part is also modified to copy the address of the crc value to a local variable usable by
     * the C code.
     *
     * Remember the little and big endian things. This time we do not have to invert the marker's value
     * because we are using _emit which emits the specified bytes in the same order we are writing them.
     */
    __asm{
	     jmp jump
	     _emit 0xBA
	     _emit 0xAD
	     _emit 0xF0
	     _emit 0x0D   ; look for 0xBAADF00D markers
      crc32_stored:
         _emit 0xFF
         _emit 0xFF
         _emit 0xFF
         _emit 0xFF   ; change this in the binary! 
         _emit 0xBA
         _emit 0xAD
         _emit 0xF0
         _emit 0x0D   ; end marker
    jump:
    	 mov eax, crc32_stored ; do a simple mov of the address where real crc will be stored
         mov crc_stored, eax   ; mov the address to a local variable, usable from C code
}
    crc = crc32_calc(CRC_BLOCK_ADDR(test), CRC_BLOCK_LEN(test));
  #ifdef TEST_BUILD
    /* This printf( ) displays the CRC value that needs to be stored in the program.
     * The printf( ) must be removed, and the program recompiled before distribution.
     */
    printf("CRC is %08X\n", crc);
  #else
    /* we are using crc_stored which is the local variable storing the address of the real crc32 value. It's value is set in __asm part of code */
    if (crc != crc_stored) {
        printf("CRC32 %#08X does not match %#08X\n", crc, crc_stored);
        return 1;
    }
    printf("CRC32 %#08X is OK\n", crc);
  #endif
return 0;
}