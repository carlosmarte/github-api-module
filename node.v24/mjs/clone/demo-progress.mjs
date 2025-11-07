#!/usr/bin/env node

/**
 * @fileoverview Simple demo showing progress integration in action
 * This demonstrates that consuming apps can control progress display completely
 */

import { clone, createSilentProgressManager } from './index.mjs';

console.log('🚀 Progress Integration Demo');
console.log('============================\n');

async function demo1_SilentWithCallbacks() {
  console.log('📊 Demo 1: Silent progress with custom callbacks');
  console.log('Nothing displays by default - consuming app controls everything\n');

  let progressCount = 0;
  let stageCount = 0;

  try {
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'demo-hello-world-silent',
      {
        onProgress: (data) => {
          progressCount++;
          if (progressCount % 5 === 0) { // Only log every 5th update to avoid spam
            console.log(`  🔄 ${data.percentage}% - ${data.message || 'Processing...'}`);
          }
        },
        onStageChange: (data) => {
          stageCount++;
          console.log(`  🎯 Stage ${stageCount}: ${data.stage.toUpperCase()}`);
        },
        onComplete: (data) => {
          console.log(`  ✅ Operation completed! ID: ${data.operationId}`);
        }
      }
    );

    console.log(`\n✅ Clone successful!`);
    console.log(`   Repository: ${repo.name}`);
    console.log(`   Location: ${repo.path}`);
    console.log(`   Progress updates: ${progressCount}`);
    console.log(`   Stages: ${stageCount}`);

  } catch (error) {
    console.log(`\n❌ Clone failed: ${error.message}`);
    console.log(`   Progress updates received: ${progressCount}`);
    console.log(`   Stages completed: ${stageCount}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

async function demo2_CustomProgressManager() {
  console.log('📊 Demo 2: Custom progress manager');
  console.log('Consuming app creates its own progress manager for full control\n');

  // Custom progress tracker
  const progressTracker = {
    logs: [],
    startTime: null,
    
    log(message) {
      const timestamp = this.startTime ? Date.now() - this.startTime : 0;
      this.logs.push({ timestamp, message });
      console.log(`  [${timestamp}ms] ${message}`);
    },
    
    getReport() {
      return {
        totalTime: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : 0,
        totalEvents: this.logs.length,
        logs: this.logs
      };
    }
  };

  const customManager = createSilentProgressManager({
    onProgress: (data) => {
      if (data.percentage % 25 === 0) { // Log every 25%
        progressTracker.log(`Progress: ${data.percentage}% (${data.message})`);
      }
    },
    onStageChange: (data) => {
      progressTracker.log(`Stage change: ${data.stage} - ${data.description}`);
    },
    onComplete: (data) => {
      progressTracker.log(`Operation complete: ${data.operationId}`);
    }
  });

  try {
    progressTracker.startTime = Date.now();
    progressTracker.log('Starting clone operation...');

    const repo = await clone(
      'https://github.com/octocat/Spoon-Knife.git',
      'demo-spoon-knife-custom',
      {
        progressManager: customManager
      }
    );

    const report = progressTracker.getReport();
    console.log(`\n✅ Clone successful!`);
    console.log(`   Repository: ${repo.name}`);
    console.log(`   Total time: ${report.totalTime}ms`);
    console.log(`   Total events: ${report.totalEvents}`);

  } catch (error) {
    const report = progressTracker.getReport();
    console.log(`\n❌ Clone failed: ${error.message}`);
    console.log(`   Events captured: ${report.totalEvents}`);
    console.log(`   Time elapsed: ${report.totalTime}ms`);
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

async function demo3_MultipleCallbacks() {
  console.log('📊 Demo 3: Multiple progress consumers');
  console.log('Show how multiple systems can consume the same progress events\n');

  // Simulated multiple consumers
  const consumers = {
    logger: {
      name: 'Logger',
      events: 0,
      onProgress: (data) => {
        consumers.logger.events++;
        if (data.percentage % 20 === 0) {
          console.log(`  📝 [Logger] ${data.percentage}%`);
        }
      }
    },
    
    database: {
      name: 'Database',
      records: [],
      onProgress: (data) => {
        consumers.database.records.push({
          timestamp: new Date().toISOString(),
          percentage: data.percentage,
          stage: data.stage,
          message: data.message
        });
      }
    },
    
    ui: {
      name: 'UI',
      lastUpdate: null,
      onProgress: (data) => {
        consumers.ui.lastUpdate = {
          percentage: data.percentage,
          message: data.message,
          timestamp: Date.now()
        };
        if (data.percentage % 30 === 0) {
          console.log(`  🖥️  [UI] Updated to ${data.percentage}%`);
        }
      }
    }
  };

  // Combined progress handler
  const combinedProgressHandler = (data) => {
    consumers.logger.onProgress(data);
    consumers.database.onProgress(data);
    consumers.ui.onProgress(data);
  };

  try {
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'demo-multiple-consumers',
      {
        onProgress: combinedProgressHandler,
        onComplete: () => {
          console.log('  🎉 All consumers notified of completion');
        }
      }
    );

    console.log(`\n✅ Clone successful with multiple consumers!`);
    console.log(`   Repository: ${repo.name}`);
    console.log(`   Logger events: ${consumers.logger.events}`);
    console.log(`   Database records: ${consumers.database.records.length}`);
    console.log(`   UI last update: ${consumers.ui.lastUpdate?.percentage}%`);

  } catch (error) {
    console.log(`\n❌ Clone failed: ${error.message}`);
    console.log(`   Logger events: ${consumers.logger.events}`);
    console.log(`   Database records: ${consumers.database.records.length}`);
    console.log(`   UI state: ${JSON.stringify(consumers.ui.lastUpdate)}`);
  }
}

// Run all demos
async function runDemos() {
  await demo1_SilentWithCallbacks();
  await demo2_CustomProgressManager();
  await demo3_MultipleCallbacks();
  
  console.log('🎉 All demos completed!');
  console.log('\nKey takeaways:');
  console.log('• By default, nothing is displayed (silent mode)');
  console.log('• Consuming apps have full control over progress display');
  console.log('• Multiple systems can consume the same progress events');
  console.log('• Legacy progress callbacks are still supported');
  console.log('• Custom progress managers provide maximum flexibility');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemos().catch(console.error);
}