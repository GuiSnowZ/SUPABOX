import { notFound } from "next/navigation";

/** Any URL that matches no page: render the localized 404 inside the site layout. */
export default function Missing() {
  notFound();
}
