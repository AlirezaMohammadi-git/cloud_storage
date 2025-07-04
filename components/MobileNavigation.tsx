"use client";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import React, { useState } from "react";
import { notFound, usePathname } from "next/navigation";
import { Separator } from "@radix-ui/react-separator";
import { navItems } from "@/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";
import { auth, signOut } from "@/auth";

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
              <SheetTitle className="mt-8 bg-slate-200 rounded-full pl-3">
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
                    <p className="caption">{email}</p>
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
              <div className="flex flex-col justify-between gap-5 pb-5">
                <Button
                  type="submit"
                  className="mobile-sign-out-button"
                  onClick={async () => await signOut()}
                >
                  <Image
                    src="/assets/icons/logout.svg"
                    alt="logo"
                    width={24}
                    height={24}
                  />
                  <p>Logout</p>
                </Button>
              </div>
            </SheetFooter>


          </SheetContent>

        </Sheet>
      </div>

    </header>
  );
};

export default MobileNavigation;
