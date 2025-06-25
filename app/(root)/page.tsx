import Image from "next/image";
import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import { Thumbnail } from "@/components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed } from "@/app/lib/actions/file.actions";
import { convertFileSize, getFileType, getUsageSummary } from "@/lib/utils";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import path from "path";

const Dashboard = async () => {
  // Parallel requests
  // const [files, totalSpace] = await Promise.all([
  //   getFiles({ types: [], limit: 10 }),
  //   getTotalSpaceUsed(),
  // ]);

  // Get usage summary
  // const usageSummary = getUsageSummary(totalSpace);

  const session = await auth();
  if (!session) throw Error("User not authenticated!");

  const files = await getFiles(
    {
      userId: session.user.id,
      types: [],
      searchText: "",
    }
  )
  if (!files?.success) return notFound();
  return (
    <div className="dashboard-container">
      <section>
        {/* <Chart used={totalSpace.used} /> */}

        {/* Uploaded file type summaries */}
        {/* <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <Link
              href={summary.url}
              key={summary.title}
              className="dashboard-summary-card"
            >
              <div className="space-y-4">
                <div className="flex justify-between gap-3">
                  <Image
                    src={summary.icon}
                    width={100}
                    height={100}
                    alt="uploaded image"
                    className="summary-type-icon"
                  />
                  <h4 className="summary-type-size">
                    {convertFileSize(summary.size) || 0}
                  </h4>
                </div>

                <h5 className="summary-type-title">{summary.title}</h5>
                <Separator className="bg-light-400" />
                <FormattedDateTime
                  date={summary.latestDate}
                  className="text-center"
                />
              </div>
            </Link>
          ))}
        </ul> */}
      </section>

      {/* Recent files uploaded */}
      {
        <section className="dashboard-recent-files">
          <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
          {(files.data as string[]).length > 0 ? (
            <ul className="mt-5 flex flex-col gap-5">
              {(files.data as string[]).map((file: string) => {

                const filePath = path.join('/uploads', session.user.id, file);


                return (
                  <Link
                    href={path.join("api", "uploads", session.user.id, file)}
                    target="_blank"
                    className="flex items-center gap-3"
                    key={file}
                  >
                    <Thumbnail
                      type={getFileType(file).type}
                      extension={getFileType(file).extension}
                      url={filePath}
                    />

                    <div className="recent-file-details">
                      <div className="flex flex-col gap-1">
                        <p className="recent-file-name">{file}</p>
                        <FormattedDateTime
                          date={""}
                          className="caption"
                        />
                      </div>
                      <ActionDropdown file={
                        {
                          $collectionId: "",
                          $createdAt: "null",
                          $databaseId: "",
                          $id: "null",
                          $updatedAt: "",
                          $permissions: ["null"]
                        }
                      } />
                    </div>
                  </Link>
                )
              })}
            </ul>
          ) : (
            <p className="empty-list">No files uploaded</p>
          )}
        </section>
      }
    </div>
  );
};

export default Dashboard;
