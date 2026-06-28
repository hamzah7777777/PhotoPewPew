export type Shoot = {
  id: string;
  slug: string;
  client_name: string;
  admin_email: string;
};

export type PhotoEdit = {
  crop_x: number;
  crop_y: number;
  crop_w: number;
  crop_h: number;
  rotation: number;
  is_favorite: boolean;
};

export type Photo = {
  id: string;
  storage_path: string;
  width: number;
  height: number;
  sort_order: number;
  original_filename: string;
  edit: PhotoEdit | null;
};

export type UnlockedShoot = {
  shoot: Shoot;
  photos: Photo[];
};

export const DEFAULT_EDIT: PhotoEdit = {
  crop_x: 0,
  crop_y: 0,
  crop_w: 1,
  crop_h: 1,
  rotation: 0,
  is_favorite: false,
};
