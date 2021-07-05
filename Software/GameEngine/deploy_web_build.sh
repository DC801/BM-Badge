CURRENT_BRANCH=$(git branch --show-current)
PREVIOUS_PATH=$(pwd)
git branch gh-pages HEAD --force
git checkout gh-pages
rm -rf deploy
mkdir -p deploy/MAGE
cp output/*.* deploy/
cp output/MAGE/game.dat deploy/MAGE
cp -r output/MAGE/desktop_assets deploy/MAGE/desktop_assets
rm deploy/MAGE/desktop_assets/index.html
git add deploy
git commit --amend --no-edit
cd ../../
git filter-branch -f --subdirectory-filter Software/GameEngine/deploy -- gh-pages
git checkout $CURRENT_BRANCH
cd $PREVIOUS_PATH
rm -rf deploy
echo If you have verified that the commit in the 'gh-pages' looks good, you may now wish to run:
echo "    git push origin gh-pages:gh-pages --force"
