export function formatOutput(data, asJson = false) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else if (data) {
    // Pretty print based on data type
    if (data.sha) {
      console.log(`SHA: ${data.sha}`);
    }
    
    if (data.url) {
      console.log(`URL: ${data.url}`);
    }
    
    if (data.ref) {
      console.log(`Ref: ${data.ref}`);
    }
    
    if (data.tag) {
      console.log(`Tag: ${data.tag}`);
    }
    
    if (data.message) {
      console.log(`Message: ${data.message}`);
    }
    
    if (data.author) {
      console.log('\nAuthor:');
      console.log(`  Name: ${data.author.name}`);
      console.log(`  Email: ${data.author.email}`);
      console.log(`  Date: ${data.author.date}`);
    }
    
    if (data.committer) {
      console.log('\nCommitter:');
      console.log(`  Name: ${data.committer.name}`);
      console.log(`  Email: ${data.committer.email}`);
      console.log(`  Date: ${data.committer.date}`);
    }
    
    if (data.tagger) {
      console.log('\nTagger:');
      console.log(`  Name: ${data.tagger.name}`);
      console.log(`  Email: ${data.tagger.email}`);
      console.log(`  Date: ${data.tagger.date}`);
    }
    
    if (data.object) {
      console.log('\nObject:');
      console.log(`  Type: ${data.object.type}`);
      console.log(`  SHA: ${data.object.sha}`);
    }
    
    if (data.tree) {
      if (data.tree.sha) {
        console.log(`Tree SHA: ${data.tree.sha}`);
      } else if (Array.isArray(data.tree)) {
        console.log(`Tree entries: ${data.tree.length}`);
      }
    }
    
    if (data.parents && Array.isArray(data.parents)) {
      console.log(`Parents: ${data.parents.map(p => p.sha).join(', ')}`);
    }
    
    if (data.verification) {
      console.log('\nVerification:');
      console.log(`  Verified: ${data.verification.verified}`);
      console.log(`  Reason: ${data.verification.reason}`);
    }
    
    if (data.content !== undefined && data.encoding) {
      console.log(`\nContent (${data.encoding}):`);
      if (data.encoding === 'base64') {
        console.log(data.content.substring(0, 100) + '...');
      } else {
        console.log(data.content);
      }
    }
  }
}