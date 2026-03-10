// Shape of a single classroom returned from the API
export type Classroom = {
    id: number;
    name: string;
    description: string | null;
    code: string;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
};

// Return type for the "Create Class" server action
export type CreateClassReturnAction =
    | {
          success: false;
          errors: {
              name?: string[];
              description?: string[];
              api?: string;
              Errorcode?: number;
          };
          values: {
              name: string;
              description: string;
          };
      }
    | {
          success: true;
          data: Classroom;
      };

// Return type for the "Join Class" server action
export type JoinClassReturnAction =
    | {
          success: false;
          errors: {
              code?: string[];
              api?: string;
              Errorcode?: number;
          };
          values: {
              code: string;
          };
      }
    | {
          success: true;
          data: {
              message: string;
              class: Classroom;
          };
      };
