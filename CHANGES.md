## v2.0.0

This is the first major update since we've taken over this project. It includes numerous changes, breaking changes, and perfs improvements.

Huge thanks to [@chrusart](https://github.com/chrusart) who started these changes and helped highlighting problems.

* **Breaking change** : remove the `loader`. Instead, you should use the `imageComponent` prop and implement your own image loading logic yourself so it doesn't affect the gallery's performance.
* A demo has been added ! It shows a basic usage of this module, with a slide counter on top and captions displayed at the bottom. Un-comment `addImages()` and `removeImages()` to check out the new improvements and fixes when the gallery re-renders.
* Refactor : `TransformableImage` and `ViewPager` dependencies are now backed-in the module. They weren't being maintained, so we won't have to wait for their respective pull requests to be merged. This allowed us to fix numerous bugs, faster.
* Refactor : Huge refactor of the whole codebase. We've rewritten a lot of code, most of the logic is intact but the library is now easier to read, and more importantly, it follows the good practices of react. There is still work to do, but most of it has been done.
* Removed the `initialListSize` prop. This was confusing, and it's not required anymore.
* Feature : the underlying `ListView` has been replaced with `FlatList` ! This should result in a significant improvement in performance.
* Feature : `errorComponent` prop. You can now provide a function to render the page of an image that couldn't be loaded. This is usually rendered with a remote image that has a broken URL.
* Feature : `scrollViewStyle` prop. Style the `FlatList` as you wish.
* Feature : you can now use the `dimensions` key in your remote images just like with your local images. That circumvents the `Image.getSize` logic, it's a little perf boost if you already know the dimensions of your remote images.
* Fix : the gallery won't crash if your remote image's URL is broken. It will now display a nice error that you can customize with the `errorComponent` prop.
* Fix : the gallery won't crash when adding or removing images.

## v1.1.0

* Feature : add `onLongPress` prop
* Fix : zooming (double tap and bouncing when pinching) on remote & local images
