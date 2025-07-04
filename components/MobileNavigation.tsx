"use client";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import React, { useState, useActionState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@radix-ui/react-separator";
import { navItems } from "@/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";
import { signOut } from "@/auth";
import { toast } from "sonner";
import { Form } from "./ui/form";
import { useForm } from "react-hook-form";
import { signOutUser } from "@/app/lib/actions/user.db.actions";

interface Props {
  id: string,
  fullname: string;
  avatar: string;
  email: string;
}

const MobileNavigation = ({
  id,
  fullname,
  avatar,
  email,
}: Props) => {


  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "error" });
  const [state, formAction, isPending] = useActionState(signOutUser, undefined)

  const form = useForm();


  useEffect(() => {

    // showToast.show prevent repead
    if (showToast.show) {
      if (showToast.type === "success") {
        toast.success(
          showToast.message, {
          className: "success-toast",
          position: "top-center",
          action: {
            label: "OK",
            onClick: () => { }
          }
        }
        )
      } else if (showToast.type === "error") {
        toast.error(
          showToast.message, {
          position: "top-center",
          className: "error-toast",
          action: {
            label: "OK",
            onClick: () => { }
          }
        }
        )
      } else if (state) {
        toast.error(
          state, {
          position: "top-center",
          className: "error-toast",
          action: {
            label: "OK",
            onClick: () => { }
          }
        }
        )
      }
    }

  }, [showToast, state])

  return (
    <header className="mobile-header">
      <Image
        src="/assets/icons/logo-full-brand.svg"
        alt="logo"
        width={120}
        height={52}
        className="h-auto"
      />


      <div className="flex-center flex-row gap-5">
        <FileUploader {...{ userId: id }} />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <Image
              src="/assets/icons/menu.svg"
              alt="Search"
              width={30}
              height={30}
            />
          </SheetTrigger>
          <SheetContent className="shad-sheet h-screen px-3">

            <div>
              <SheetTitle className="mt-8 pl-3">
                <div className="header-user">
                  <Image
                    src={avatar}
                    alt="avatar"
                    width={44}
                    height={44}
                    className="header-user-avatar"
                  />
                  <div className="sm:hidden lg:block">
                    <p className="subtitle-2 capitalize">{fullname}</p>
                    <p className="caption text-gray-500">{email}</p>
                  </div>
                </div>
                <Separator className="mb-4 bg-light-200/20" />
              </SheetTitle>

              <nav className="mobile-nav">
                <ul className="mobile-nav-list">
                  {navItems.map(({ url, name, icon }) => (
                    <Link key={name} href={url} className="lg:w-full">
                      <li
                        onClick={() => setOpen(false)}
                        className={cn(
                          "mobile-nav-item",
                          pathname === url && "shad-active",
                        )}
                      >
                        <Image
                          src={icon}
                          alt={name}
                          width={24}
                          height={24}
                          className={cn(
                            "nav-icon",
                            pathname === url && "nav-icon-active",
                          )}
                        />
                        <p>{name}</p>
                      </li>
                    </Link>
                  ))}
                </ul>
              </nav>


            </div>

            <SheetFooter>

              <Form {...form}>
                <form action={formAction} className="flex flex-col justify-between gap-5 pb-5">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="mobile-sign-out-button"
                  >
                    <Image
                      src="/assets/icons/logout.svg"
                      alt="logo"
                      width={24}
                      height={24}
                    />
                    <p>Logout</p>
                  </Button>
                </form>
              </Form>

            </SheetFooter>


          </SheetContent>

        </Sheet>
      </div>

    </header>
  );
};

export default MobileNavigation;
