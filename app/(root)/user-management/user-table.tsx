"use client";

import { useState } from "react";
import { UserDto } from "../../../types/user/user.dto";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { UpdateUserDialog } from "./update-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface Props {
  initialUsers: UserDto[];
}

export const UserTable: React.FC<Props> = (props) => {
  const { initialUsers } = props;
  const [users, setUsers] = useState<UserDto[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditClick = (user: UserDto) => {
    setSelectedUser(user);
    setIsUpdateDialogOpen(true);
  };

  const handleDeleteClick = (user: UserDto) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: UserDto) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <>
      <div className="grid grid-cols-12 p-2 pl-6 font-medium">
        <div className="col-span-4 text-xs">Name</div>
        <div className="col-span-4 text-xs">Email</div>
        <div className="col-span-2 text-xs">Role</div>
        <div className="col-span-2 text-xs text-right">Actions</div>
      </div>
      {users.map((user) => (
        <div key={user.id} className="grid grid-cols-12 p-2 pl-6 mb-2 bg-secondary rounded-xl relative">
          <div className="bg-primary rounded-full h-2/3 w-1 absolute left-2 top-1/2 -translate-y-1/2"></div>
          <div className="col-span-4 text-sm flex items-center">
            {user.name}
          </div>
          <div className="col-span-4 text-sm flex items-center">
            {user.email}
          </div>
          <div className="col-span-2 text-sm flex items-center">
            {user.roles.join(", ")}
          </div>
          <div className="col-span-2 text-sm flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
              onClick={() => handleEditClick(user)}
            >
              <PencilIcon className="size-3" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2 text-xs"
              onClick={() => handleDeleteClick(user)}
            >
              <TrashIcon className="size-3" />
              Delete
            </Button>
          </div>
        </div>
      ))}
      <UpdateUserDialog
        user={selectedUser}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
      <DeleteUserDialog
        user={userToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onUserDeleted={handleUserDeleted}
      />
    </>
  );
};
