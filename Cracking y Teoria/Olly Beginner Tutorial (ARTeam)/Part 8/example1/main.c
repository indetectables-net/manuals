int main(int argc, char* argv[])
{
// The ciphered string "Hello, Free World!"
char s0[]="\x0C\x21\x28\x28\x2B\x68\x64\x02\x36\x21\x21\x64\x13\x2B\x36\x28\x20\x65\x49\x4E";
__asm
{
BeginCode:                       
                                 

        pusha                    
                                 
        lea ebx, s0              
GetNextChar:                     
        xor eax, eax             
        lea esi, BeginCode       
        lea ecx, EndCode         
        sub ecx, esi             
        HarvestCRC:              
        lodsb                    
        Add eax, eax             
        loop HarvestCRC          
        xor [ebx], ah            
        Inc ebx                  
        cmp [ebx], 0             
        jnz GetNextChar          
        popa                     
EndCode:                         
        nop                      
}
printf(s0);                     //The string is diplayed.
return 0;
}