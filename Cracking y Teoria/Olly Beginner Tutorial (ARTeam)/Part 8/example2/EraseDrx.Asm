.686
.model flat, stdcall  ;32 bit memory model
option casemap :none  ;case sensitive
assume fs:nothing	;MASM feature (otherwise FS assumed to be ERROR)
include EraseDrx.Inc

.code

start:
; ### set the S.E.H ###
	push offset mySEH
	push dword ptr fs:[0]
	mov dword ptr fs:[0],esp
	
	;*** now everything will be covered by our SEH ***
	
	; raise an invalid opcode exception
	UD2
	
	@@SafeOffset: ; this is where we can safely return from our SEH
	fnop
	
	;try to hardware BP one of those NOP
	nop
	nop
	nop
	nop
	
	
	;*** now this is this end of the SEH ***
	pop dword ptr fs:[0]
	add esp,4
	ret ;return to ExitThread

;******************************
; OUR SEH handler
;*******************************
;***********************
mySEH proc C lpExcept:DWORD, lpFrame:DWORD, lpContext:DWORD, lpDispatch:DWORD

	mov ecx,[lpContext]
	
	; push all linear addresses of drx (from Dr0 to Dr3)
	; you should see your hardware BP there (just to demonstrate where they are)
	push [ecx][CONTEXT.iDr0]
	push [ecx][CONTEXT.iDr1]
	push [ecx][CONTEXT.iDr2]
	push [ecx][CONTEXT.iDr3]
	add esp,4*4 ; skip them
	
	;erase DR0 to DR3
	push 0
	push 0
	push 0
	push 0
	
	pop [ecx][CONTEXT.iDr0]
	pop [ecx][CONTEXT.iDr1]
	pop [ecx][CONTEXT.iDr2]
	pop [ecx][CONTEXT.iDr3]
	
	;erase also DR7
	push 0
	pop [ecx][CONTEXT.iDr7]
	
	;now set EIP to our SafeOffset
	push offset @@SafeOffset
	pop [ecx][CONTEXT.regEip]
	
	mov eax,FALSE
	ret
	
mySEH endp

end start