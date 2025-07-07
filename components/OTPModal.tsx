"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { verifySecret, sendEmailOTP } from "@/app/lib/actions/user.actions";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { formatTime } from "@/lib/utils";

const OtpModal = ({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendStatus, setResendStatus] = useState(true);
  const [cutDown, setCutDown] = useState(0);


  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("")

    if (password.length === 0) {
      setErrorMessage("Please enter the code!")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setErrorMessage("Invalid code.(The code lenght should be 6 digit)")
      setIsLoading(false)
      return
    }

    try {
      const sessionId = await verifySecret({ accountId, password });

      if (sessionId) router.push("/");
    } catch (error) {
      setErrorMessage("Failed to verify OTP")
      console.log("Failed to verify OTP", error);
    } finally {
      setIsLoading(false);
    }

  };

  useEffect(() => {

    setCutDown(60)
    if (!resendStatus) {
      const playCutDown = () => {
        if (cutDown <= 0) {
          console.log("interval cleared")
          clearInterval(cutDownInterval)
          setResendStatus(true)
        } else {
          console.log(`interval is running... (${cutDown})`)
          setCutDown(prev => {
            if (prev > 0) {
              return prev - 1;
            } else {
              clearInterval(cutDownInterval);
              setResendStatus(true)
              return prev
            }
          });
        }
      }
      let cutDownInterval = setInterval(playCutDown, 1000)
    }



  }, [resendStatus])

  const handleResendOtp = async () => {
    setErrorMessage("")
    setPassword("")
    setResendStatus(false)
    await sendEmailOTP({ email });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader className="relative flex justify-center">
          <AlertDialogTitle className="h2 text-center">
            Enter Your OTP
            <Image
              src="/assets/icons/close-dark.svg"
              alt="close"
              width={20}
              height={20}
              onClick={() => setIsOpen(false)}
              className="otp-close-button"
            />
          </AlertDialogTitle>
          <AlertDialogDescription className="subtitle-2 text-center text-light-100">
            We&apos;ve sent a code to{" "}
            <span className="pl-1 text-brand">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <InputOTP maxLength={6} value={password} onChange={setPassword} pattern={REGEXP_ONLY_DIGITS}>
          <InputOTPGroup className="shad-otp">
            <InputOTPSlot index={0} className="shad-otp-slot" />
            <InputOTPSlot index={1} className="shad-otp-slot" />
            <InputOTPSlot index={2} className="shad-otp-slot" />
            <InputOTPSlot index={3} className="shad-otp-slot" />
            <InputOTPSlot index={4} className="shad-otp-slot" />
            <InputOTPSlot index={5} className="shad-otp-slot" />
          </InputOTPGroup>
        </InputOTP>

        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-4">
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isLoading}
              className="shad-submit-btn h-12"
              type="button"
            >
              Submit
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="ml-2 animate-spin"
                />
              )}
            </AlertDialogAction>

            <div className="subtitle-2 mt-2 text-center text-light-100">
              Didn&apos;t get a code?
              <Button
                type="button"
                variant="link"
                disabled={!resendStatus}
                className="pl-1 text-brand"
                onClick={handleResendOtp}
              >
                {
                  !resendStatus ? formatTime(cutDown) : "Resend code"
                }
              </Button>
            </div>

            {errorMessage && <p className="text-sm text-error text-center">{errorMessage}</p>}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;
