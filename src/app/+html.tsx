import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web-only HTML shell used during static rendering. It sets the dark background
// before JavaScript loads so the first paint matches the app instead of flashing
// white.
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0B0F14" />
        <meta
          name="description"
          content="SetLog — an offline-first workout set logger built with Expo, React Native, TypeScript, and Supabase."
        />
        <title>SetLog</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: "html,body{background-color:#0B0F14;color:#F5F7FA;}",
          }}
        />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
