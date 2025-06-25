"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { uuidv4 } from "@/lib/utils";
import { avatarPlaceholderUrl } from "@/constants";
import { authenticate, InsertNewUser } from "@/app/lib/actions/user.db";
import { signIn } from "@/auth";
import { useSearchParams } from "next/navigation";
import { providerMap } from "@/auth.config";
import { Separator } from "@radix-ui/react-separator";

type FormType = "sign-in" | "sign-up";

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullname:
      formType === "sign-up"
        ? z.string().min(2).max(50)
        : z.string().optional(),
    password:
      formType === "sign-up"
        ? z.string().min(6).max(50)
        : z.string().optional(),
    showPassword:
      formType === "sign-up"
        ? z.boolean()
        : z.boolean().optional()
  });
};


const AuthForm = ({ type }: { type: FormType }) => {

  const [inputType, setInputType] = useState("password")
  const [state, formAction, isPending] = useActionState(authenticate, undefined)
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get("error")


  const formSchema = authFormSchema(type)
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      showPassword: false
    },
  })

  return (
    <>
      <Form {...form}>
        <form action={formAction} className="space-y-3 w-5/6 sm:w-3/6 max-w-[600]">

          <h1 className="form-title">{type === "sign-in" ? "Log In" : "Create Account"}</h1>

          {type === "sign-up" &&
            <>

              <input type="hidden" name="method" value={"credentials"} />
              <input type="hidden" name="type" value={"sign-up"} />
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
                        <Input type="email" required className="shad-input" placeholder="Enter your email" {...field} disabled={isPending} />
                      </div>
                    </FormControl>

                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Password</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type={inputType} required className="shad-input" placeholder="Enter your password" {...field} disabled={isPending} />
                      </div>
                    </FormControl>
                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />


              <FormField
                control={form.control}
                name="showPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center gap-3 pl-2">
                      <FormControl>
                        <Input
                          type="checkbox"
                          defaultChecked={false}
                          className="w-5"
                          onClick={() => {
                            if (inputType === "password") {
                              setInputType("text")
                            } else {
                              setInputType("password")
                            }
                          }} />
                      </FormControl>
                      <FormLabel >show password</FormLabel>
                    </div>

                  </FormItem>
                )} />

            </>
          }

          {type === "sign-in" &&
            <>

              <input type="hidden" name="method" value={"credentials"} />
              <input type="hidden" name="type" value={"sign-in"} />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Email</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type="email" required className="shad-input" placeholder="Enter your email" {...field} disabled={isPending} />
                      </div>
                    </FormControl>

                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form-label">Password</FormLabel>
                    <FormControl>
                      <div className="shad-form-item">
                        <Input type={inputType} required className="shad-input" placeholder="Enter your password" {...field} disabled={isPending} />
                      </div>
                    </FormControl>
                    <FormMessage className="shad-form-message" />
                  </FormItem>
                )} />


              <FormField
                control={form.control}
                name="showPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center gap-3 pl-2">
                      <FormControl>
                        <Input
                          type="checkbox"
                          defaultChecked={false}
                          className="w-5"
                          onClick={() => {
                            if (inputType === "password") {
                              setInputType("text")
                            } else {
                              setInputType("password")
                            }
                          }} />
                      </FormControl>
                      <FormLabel >show password</FormLabel>
                    </div>

                  </FormItem>
                )} />

            </>}

          <Button className="form-submit-button" type="submit" disabled={isPending}>
            {type === "sign-in" ? "Log In" : "Create"}
            {isPending &&
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="animate-spin ml-2"
              />}
          </Button>

          {state && <p className="error-message">{state}</p>}
          {error && <p className="error-message">{error}</p>}

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
        providerMap.length > 0 && (
          <div className="w-5/6 sm:w-3/6 flex flex-row justify-between items-center px-6 my-3">
            <Separator className=" w-full h-0.5 rounded-full bg-gray-300" />
            <p className="px-2 text-gray-500">OR</p>
            <Separator className=" w-full h-0.5 rounded-full bg-gray-300" />
          </div>
        )
      }

      {
        Object.values(providerMap).map(provider => (
          <form action={formAction} key={provider.id} className="space-y-3 w-5/6 sm:w-3/6 max-w-[600]">
            <input type="hidden" name="method" value={"OAuth"} />
            <input type="hidden" name="providerId" value={provider.id} />
            <input type="hidden" name="redirectTo" value={callbackUrl} />
            <Button className="form-submit-button">{provider.name}</Button>
          </form>
        ))
      }
    </>
  )

};

export default AuthForm;
