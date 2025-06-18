"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createAccount, signInUser } from "@/lib/actions/user.actions";
import OtpModal from "@/components/OTPModal";

type FormType = "sign-in" | "sign-up";

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullname:
      formType === "sign-up"
        ? z.string().min(2).max(50)
        : z.string().optional(),
  });
};


const AuthForm = ({ type }: { type: FormType }) => {

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [accountId, setAccountId] = useState('')

  const formSchema = authFormSchema(type)
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: ""
    },
  })

  // 2. Define a submit handler.
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (type === "sign-up") {
      setIsLoading(true)
      setErrorMessage("")
      try {
        const user = await createAccount({
          fullName: values.fullname || "",
          email: values.email
        })
        if (user.accountId) {
          setAccountId(user.accountId)
        } else if (user.error) {
          setErrorMessage(user.error)
        }
      } catch (err) {
        setErrorMessage("Failed to create account. Please try again later!")
      } finally {
        setIsLoading(false)
      }
    } else if (type === "sign-in") {
      setIsLoading(true)
      setErrorMessage("")
      try {
        const user = await signInUser({ email: values.email });
        if (user.accountId) {
          setAccountId(user.accountId)
        }
        if (user.error) {
          setErrorMessage(user.error)
        }
      } catch (err) {
        console.log(err)
        setErrorMessage("Something went wrong! Please try again later.")
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-3/4 max-w-[500]">

          <h1 className="form-title">{type === "sign-in" ? "Log In" : "Create Account"}</h1>

          {type === "sign-up" &&
            <>

              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Full name</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type="text" required className="shad-input" placeholder="Enter your full name" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Email</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type="email" required className="shad-input" placeholder="Enter your email" {...field} />
                      </div>
                    </FormControl>

                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />
            </>
          }

          {type === "sign-in" &&
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Email</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type="email" required className="shad-input" placeholder="Enter your email" {...field} />
                      </div>
                    </FormControl>

                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />
            </>}


          <Button className="form-submit-button" type="submit" disabled={isLoading}>
            {type === "sign-in" ? "Log In" : "Create"}
            {isLoading &&
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="animate-spin ml-2"
              />}
          </Button>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="body-2 flex justify-center">
            <p className="text-light-100">{
              type === "sign-in" ? "Don't have an account?" : "Already have an account?"
            }</p>
            <Link
              className="ml-1 font-medium text-brand"
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}>
              {type === "sign-in" ? "Create one" : "Log In"}
            </Link>
          </div>
        </form>
      </Form>

      {
        accountId && (
          <OtpModal accountId={accountId} email={form.getValues("email")} />
        )
      }

    </>
  )

};

export default AuthForm;
