import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOut } from "@/auth";

const Header = ({ id }: { id: string }) => {
  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <FileUploader {...{ userId: id }} />
        <form
          action={async () => {
            "use server";
            await signOut({
              redirectTo: "/sign-in"
            });
          }}
        >
          <Button type="submit" className="sign-out-button">
            <Image
              src="/assets/icons/logout.svg"
              alt="logo"
              width={24}
              height={24}
              className="w-6"
            />
          </Button>
        </form>
      </div>
    </header>
  );
};
export default Header;
