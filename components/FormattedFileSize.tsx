import React from "react";
import { cn, convertFileSize, formatDateTime } from "@/lib/utils";

export const FormattedFileSize = ({
  sizeInBytes,
  className,
}: {
  sizeInBytes: number;
  className?: string;
}) => {
  return (
    <p className={cn("body-1 text-light-200", className)}>
      {convertFileSize(sizeInBytes)}
    </p>
  );
};
export default FormattedFileSize;
