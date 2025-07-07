import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize, getFileType } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedFileSize";
import ActionDropdown from "@/components/ActionDropdown";

const Card = ({ file, owner, currentUser }: { file: FileMetadata, owner: string, currentUser: User }) => {
  const isShared = file.owner !== currentUser.id;
  return (
    <Link href={file.url} target="_blank" className="file-card">
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={getFileType(file.name).extension}
          url={file.url}
          className="!size-20"
          imageClassName="!size-11"
        />

        <div className="flex flex-col justify-center">
          <ActionDropdown file={file} currentUser={currentUser} owner={owner} />
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>

        <div className="flex flex-row gap-1 justify-start items-center text-light-200">
          <p className="body-1 caption">{convertFileSize(file.size)}</p>
          <p>{` • `}</p>
          <FormattedDateTime
            creationDate={file.lastEdited}
            className="body-2 text-light-200 caption"
          />
        </div>

        {isShared &&
          <p className="caption line-clamp-1 text-light-200">
            shared by : {owner}
          </p>
        }

      </div>
    </Link>
  );
};
export default Card;
