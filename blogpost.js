class BlogUser{
    /**
    * Constructor for creating a new User object
    * @param {string} username - The username of the user
    * @param {string} fullName - The full name of the user
    */
   #fullName;
   constructor(username, fullName){
       this.username = username;
       this.fullName = fullName;
       this.posts = [];
   }

   /**
    * 
    * @param {string} title - The title of the blog post 
    * @param {string} content - The content of the blog post
    */


   

   createBlogPost(title, content){
       const newPost = new BlogPost(title, content, this.username);
       this.posts.push(newPost);
       
   }

   /**
    * 
    * @param {string} title - The post you want to change, selected through title. 
    * @param {*} newContent - The new update post
    * @returns 
    */

   editBlogPost(title, newContent){
       for(let i = 0; i < this.posts.length; i++){
           let n = 0;
           if(this.posts[i].title == title){
               this.posts[i].content = newContent;
               console.log(`Post that is titled "${title} has been updated"`);
               return; // exit
           }
       }
       console.log(`No post found with this title "${title}"`);
   }

   /**
    * 
    * @param {string} title - The post you want to delete, searched through title. 
    * @returns 
    */

   deleteBlogPost(title){
       for(let i = 0; i < this.posts.length; i++){
           if(this.posts[i].title === title){
               this.posts.splice(i, 1);
               console.log(`Post titled "${title}" has been deleted.`);
               return; // exit
           }
       }
       console.log(`No post found with this title "${title}"`);
   }

   displayBlogPosts(){
       console.log(`Posts by ${this.username}:`);
       this.posts.forEach((post) => {
           post.showBlogPost()
       })
   }

   
}

/**
* 
*/

class BlogPost{

    /**
     * 
     * @param {string} title - title of the post 
     * @param {string} content - content of the post
     * @param {string} username - the writer of the post
     */
   constructor(title, content, username){
       this.title = title;
       this.content = content;
       this.username = username;
       this.createdAt = new Date();
   }

   /**
    * Display the post content in a formatter manner
    */

   showBlogPost(){
       console.log(`@${this.username} posted on ${this.createdAt}:`)
       console.log(`#${this.title}...`);
       console.log(this.content);
       console.log(`--------------------`) // separator for clarity
   }
}

// Create two BlogUser instances
const user1 = new BlogUser('tinyikotsamane', 'Tinyiko');
const user2 = new BlogUser('johndoe', 'John')

// Create multiple blog posts
user1.createBlogPost('Productivity', 'Being productive these days is difficult.');
user1.createBlogPost('Grateful', 'Show gratitude for the small things in life.');
user2.createBlogPost('Love', 'Love is underrated.');
user2.createBlogPost('Best Careers', 'Any career in the tech space is the best #SoftwareDevelopment');

// Editing a post
user1.editBlogPost('Productivity', 'Being productive these days is difficult. The reason for this is the distractions of social media!!');
user2.editBlogPost('Love', 'Love is underrated. People do not appreciate it anymore.')


// Deleting a post
user2.deleteBlogPost('Best Careers');


// Displaying posts
user1.displayBlogPosts();
user2.displayBlogPosts();