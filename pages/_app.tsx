import Head from 'next/head';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Analytics } from "@vercel/analytics/react"

function MyApp( { Component, pageProps }: AppProps ) {

  return ( <>  <Head>
    <title>One-Click Folder Flattener</title>
    <meta name="description" content="A tool to flatten directory structures for easier file management" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="One-Click Folder Flattener" />
    <meta property="og:description" content="Easily flatten directory structures with our tool." />
    <meta property="og:url" content="https://bitfire.ai/tools/one-click-folder-flattener" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="One-Click Folder Flattener" />
    <meta name="twitter:description" content="Flatten directory structures for easier file management." />
  </Head><Component { ...pageProps } />
    {/* Disabling analytics for now. If there's an influx of bots or something that costs $$ or something I may have to turn it back on. */ }
    {/* <Analytics /> */}
  </> );
}

export default MyApp;