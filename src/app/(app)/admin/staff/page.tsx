import { deleteUserAction } from "@/app/actions/staff";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABEL, formatDate, type Role } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { StaffForm } from "./staff-form";

export const metadata = { title: "Staff · Brightloop" };

export default async function StaffPage() {
  const admin = await requireRole("ADMIN");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Only administrators can create staff accounts. Customers self-register."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team members</CardTitle>
            <CardDescription>
              {staff.length} admin/staff account{staff.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                        {ROLE_LABEL[member.role as Role] ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.id === admin.id ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <DeleteButton
                          id={member.id}
                          action={deleteUserAction}
                          title={`Remove ${member.name}?`}
                          description="Their account will be deleted and they will lose access immediately."
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add staff account</CardTitle>
            <CardDescription>
              Creates a STAFF login with the password policy enforced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
