import React from "react";
import { cn, convertFileSize, formatDateTime } from "@/lib/utils";

export const FormattedFileSize = ({
  sizeInBytes,
  className,
  creationDate
}: {
  sizeInBytes?: number;
  className?: string;
  creationDate?: Date;
}) => {
  return (
    <p className={cn("body-1 text-light-200", className)}>
      {sizeInBytes && convertFileSize(sizeInBytes)}
      {creationDate && formatDateTime(creationDate.toISOString())}
    </p>
  );
};
export default FormattedFileSize;
