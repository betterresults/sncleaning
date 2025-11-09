package com.sncleaning.cleaners;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Prevent app content from going under system bars
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
