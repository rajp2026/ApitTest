import { useEffect } from 'react';

const DocsPage = () => {
  // Scroll to top when Docs view is mounted
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner specific for Docs */}
      <div className="bg-blue-600 w-full py-12 px-6">
        <div className="max-w-7xl mx-auto flex gap-4 items-center">
            <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">ApiTest Documentation</h1>
                <p className="text-blue-200 mt-2 text-lg">The comprehensive guide to building, sending, and managing API requests.</p>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row py-12 px-6 gap-12">
        {/* Left Sidebar Table of Contents */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">On this page</h3>
            <ul className="space-y-3 text-sm text-gray-600 font-medium border-l-2 border-slate-100 pl-4">
              <li><a href="#welcome" className="hover:text-blue-600 transition-colors block">Welcome to ApiTest</a></li>
              <li>
                <a href="#organizing" className="hover:text-blue-600 transition-colors block mt-2">1. Organizing Your Work</a>
                <ul className="pl-4 mt-2 space-y-2 text-gray-500 font-normal">
                  <li><a href="#workspaces" className="hover:text-blue-600 block">Workspaces & Collections</a></li>
                </ul>
              </li>
              <li>
                <a href="#builder" className="hover:text-blue-600 transition-colors block mt-2">2. The Request Builder</a>
                <ul className="pl-4 mt-2 space-y-2 text-gray-500 font-normal">
                  <li><a href="#url" className="hover:text-blue-600 block">HTTP Method & URL</a></li>
                  <li><a href="#params" className="hover:text-blue-600 block">Query & Path Params</a></li>
                  <li><a href="#headers" className="hover:text-blue-600 block">Headers & Body</a></li>
                </ul>
              </li>
              <li><a href="#responses" className="hover:text-blue-600 transition-colors block mt-2">3. Analyzing Responses</a></li>
              <li><a href="#history" className="hover:text-blue-600 transition-colors block mt-2">4. History Tracking</a></li>
              <li><a href="#security" className="hover:text-blue-600 transition-colors block mt-2">5. Account & Security</a></li>
            </ul>
          </div>
        </div>

        {/* Main Content Area Using Tailwind Typography (prose) */}
        <article className="prose prose-slate prose-lg max-w-3xl prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-slate-200 prose-headings:font-bold prose-a:text-blue-600">
          
          <div id="welcome">
            <h2 className="text-3xl mt-0">Welcome to ApiTest</h2>
            <p>
                Welcome to <strong>ApiTest</strong>, your modern, streamlined platform for building, sending, and managing API requests. This guide will walk you through the core features of the platform from an end-user perspective, helping you organize your workflows and test APIs efficiently.
            </p>
          </div>

          <hr className="my-10 border-slate-200" />
          
          <h2 id="organizing">1. Organizing Your Work</h2>
          <p>The foundation of ApiTest is organization. You can structure your API requests logically just like a file system.</p>
          
          <h3 id="workspaces">Workspaces & Collections</h3>
          <p>
            A <strong>Workspace</strong> is the highest level of organization. It usually represents a specific project, heavily used by a specific team (e.g., "E-Commerce App" or "Payment Gateway").
            Inside a Workspace, you can create <strong>Collections</strong>. Think of these as folders to group related endpoints together (e.g., "Users API", "Orders API").
          </p>

          <h4>Workspace-Level vs Collection-Level Requests</h4>
          <p>Our platform is highly flexible:</p>
          <ul>
            <li><strong>Collection Requests</strong>: You can save a request inside a specifically created Collection for deep organization.</li>
            <li><strong>Direct Workspace Requests</strong>: You can save a request <em>directly</em> under a Workspace. These will appear at the top of your Sidebar tree, perfect for quick scripts, one-off tests, or general queries.</li>
          </ul>

          <figure>
            <img src="/assets/workspace_sidebar.png" alt="Workspace Sidebar Example" />
            <figcaption className="text-center text-sm text-slate-500 mt-2 italic">Example: A well-organized Workspace showing both independent requests and categorized Collections</figcaption>
          </figure>

          <hr className="my-10 border-slate-200" />

          <h2 id="builder">2. Creating & Sending Requests</h2>
          <p>The Request Builder is where all the magic happens. It is divided into three main sections: The URL Bar, Configuration Tabs, and the Response View.</p>

          <figure>
            <img src="/assets/request_builder.png" alt="Request Builder Interface" />
            <figcaption className="text-center text-sm text-slate-500 mt-2 italic">Example: Building a GET Request with specific custom Headers</figcaption>
          </figure>

          <h3 id="url">HTTP Method & URL</h3>
          <p>At the very top, select your desired HTTP method (GET, POST, PUT, DELETE, PATCH) from the dropdown, and enter the target API endpoint URL.</p>

          <h3 id="params">Query & Path Parameters</h3>
          <p>Instead of manually typing long query strings (<code>?sort=desc&limit=10</code>), use the <strong>Params</strong> tab. Enter your Key and Value pairs in the interactive table, and the platform will automatically append them correctly to your URL.</p>
          <p>Our platform features <strong>Smart Path Detection</strong>. If your API requires a path variable—for example, <code>/users/:id</code>—the platform automatically detects the <code>:id</code> parameter and creates a dedicated input box for you to fill it in dynamically.</p>

          <h3 id="headers">Headers & Body</h3>
          <p>Use the <strong>Headers</strong> tab to pass any required metadata or authentication exactly as you need to. Popular keys include <code>Authorization</code> and <code>Content-Type</code>.</p>
          <p>For POST, PUT, and PATCH requests, switch to the <strong>Body</strong> tab. Here you can write raw text or structural JSON payloads to send data to your server.</p>

          <hr className="my-10 border-slate-200" />

          <h2 id="responses">3. Analyzing Responses</h2>
          <p>Once you click the bright <strong>Send</strong> button, the Response Panel will populate almost instantly.</p>

          <figure>
            <img src="/assets/response_panel.png" alt="API Response View" />
            <figcaption className="text-center text-sm text-slate-500 mt-2 italic">Example: Successful 200 OK Response featuring beautiful syntax highlighting</figcaption>
          </figure>

          <p>The Response panel gives you immediate insights:</p>
          <ul>
            <li><strong>Status Badge</strong>: Quickly see if the request succeeded (<code>200 OK</code>) or failed (<code>404 Not Found</code>, <code>500 Server Error</code>).</li>
            <li><strong>Time Taken</strong>: See the exact latency in milliseconds (<code>ms</code>), crucial for performance testing.</li>
            <li><strong>Payload Size</strong>: Track the bandwidth of the response (e.g., <code>2.4 KB</code>).</li>
            <li><strong>Response Body</strong>: An integrated code editor provides beautiful syntax highlighting, indenting complex JSON responses so they are incredibly easy to read and debug.</li>
          </ul>

          <hr className="my-10 border-slate-200" />

          <h2 id="history">4. History Tracking</h2>
          <p>Every time you hit Send, ApiTest automatically logs the exact URL, Headers, method, and Body you used. Navigate to the <strong>History</strong> tab (clock icon) to see a chronological feed of your past API calls.</p>
          <p>Clicking on any historical request will <strong>instantly reload</strong> it into the Request Builder, allowing you to replay or modify past requests effortlessly!</p>

          <hr className="my-10 border-slate-200" />

          <h2 id="security">5. Account Management & Security</h2>
          <p>To ensure your Workspaces, Collections, and Saved Requests persist securely, create a free account.</p>
          <p>All accounts are protected by enterprise-grade <strong>SHA-256 pre-hashed bcrypt</strong> passwords, ensuring your data is safe even if the platform scales rapidly. Enjoy exploring your APIs!</p>

        </article>
      </div>
    </div>
  );
};

export default DocsPage;
