import { savePhotoFile, savePhotoFromUrl } from './photos';

/** Resolve the photo to store from the submitted form: uploaded file first, then OFF image URL. */
export async function photoFromForm(form: FormData, imageUrl: string): Promise<string | null> {
	const file = (form.get('photo') ?? form.get('photoFile')) as File | null;
	if (file && typeof file === 'object' && file.size > 0) return savePhotoFile(file);
	if (imageUrl) return savePhotoFromUrl(imageUrl);
	return null;
}
