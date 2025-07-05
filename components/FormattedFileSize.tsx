import React from "react";
import { cn, convertFileSize, formatDateTime } from "@/lib/utils";

export const FormattedFileSize = ({
  sizeInBytes,
  className,
  creationDate,
  shared
}: {
  sizeInBytes?: number;
  className?: string;
  creationDate?: Date;
  shared?: boolean;
}) => {
  return (
    <>
      <div className="flex flex-row">
        <p className={cn("body-1 text-light-200", className)}>
          {creationDate && `${formatDateTime(creationDate.toISOString())}${sizeInBytes ? " - " : ""}`}
          {sizeInBytes && `${convertFileSize(sizeInBytes)}${shared ? " - " : ""}`}
          {shared && `shared`}
        </p>
      </div>
    </>
  );
};
export default FormattedFileSize;
